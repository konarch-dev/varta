const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const TARGET_HOST = 'images.unsplash.com';

async function cleanPostsWithUnsplashImages() {
  console.log('================================================================');
  console.log('🧹 REMOVING ALL POSTS CONTAINING IMAGES FROM:');
  console.log(`🌐 Target: https://${TARGET_HOST}/`);
  console.log('================================================================\n');

  console.log('🔍 Scanning database for posts with Unsplash media...');

  // 1. Find all PostMedia records matching images.unsplash.com
  const matchingMedia = await prisma.postMedia.findMany({
    where: {
      OR: [
        { url: { contains: TARGET_HOST } },
        { thumbnailUrl: { contains: TARGET_HOST } },
      ],
    },
    select: {
      id: true,
      postId: true,
    },
  });

  console.log(`Found ${matchingMedia.length} media records referencing ${TARGET_HOST}.`);

  const targetPostIds = [...new Set(matchingMedia.map((m) => m.postId))];
  console.log(`Found ${targetPostIds.length} unique posts containing Unsplash images.`);

  if (targetPostIds.length === 0) {
    console.log('✅ No posts found with Unsplash images. Database is already clean.');
    return;
  }

  // 2. Find any child replies to these target posts in batches
  console.log('🔍 Identifying threaded replies to target posts...');
  const BATCH_SIZE = 1000;
  const replyPostIds = [];

  for (let i = 0; i < targetPostIds.length; i += BATCH_SIZE) {
    const chunk = targetPostIds.slice(i, i + BATCH_SIZE);
    const replies = await prisma.post.findMany({
      where: {
        parentId: { in: chunk },
      },
      select: { id: true },
    });
    replyPostIds.push(...replies.map((r) => r.id));
  }

  const uniqueReplyIds = [...new Set(replyPostIds)];
  console.log(`Found ${uniqueReplyIds.length} threaded replies to these posts.`);

  // 3. Find all affected groups to reconcile postCount later
  console.log('🔍 Identifying affected community groups...');
  const allPostIds = [...new Set([...uniqueReplyIds, ...targetPostIds])];
  const affectedGroupIdsSet = new Set();

  for (let i = 0; i < allPostIds.length; i += BATCH_SIZE) {
    const chunk = allPostIds.slice(i, i + BATCH_SIZE);
    const postsWithGroups = await prisma.post.findMany({
      where: {
        id: { in: chunk },
        groupId: { not: null },
      },
      select: { groupId: true },
    });
    postsWithGroups.forEach((p) => {
      if (p.groupId) affectedGroupIdsSet.add(p.groupId);
    });
  }

  const affectedGroupIds = [...affectedGroupIdsSet];
  console.log(`Affected communities/groups to reconcile: ${affectedGroupIds.length}`);

  // 4. Batch delete dependent relations (PostMedia, Like, Bookmark, Repost, PostHashtag, Mention)
  console.log(`\n🗑️ Deleting associated relations across ${allPostIds.length} posts in batches...`);

  for (let i = 0; i < allPostIds.length; i += BATCH_SIZE) {
    const chunk = allPostIds.slice(i, i + BATCH_SIZE);

    await prisma.postMedia.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.like.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.bookmark.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.repost.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.postHashtag.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.mention.deleteMany({ where: { postId: { in: chunk } } });

    const progress = Math.min(i + BATCH_SIZE, allPostIds.length);
    console.log(`   • Cleared dependent relations: ${progress}/${allPostIds.length} posts`);
  }

  // 5. Delete replies first, then target posts
  if (uniqueReplyIds.length > 0) {
    console.log(`\n🗑️ Deleting ${uniqueReplyIds.length} threaded replies...`);
    for (let i = 0; i < uniqueReplyIds.length; i += BATCH_SIZE) {
      const chunk = uniqueReplyIds.slice(i, i + BATCH_SIZE);
      await prisma.post.deleteMany({ where: { id: { in: chunk } } });
    }
    console.log(`✅ Deleted ${uniqueReplyIds.length} threaded replies.`);
  }

  console.log(`\n🗑️ Deleting ${targetPostIds.length} Unsplash posts...`);
  for (let i = 0; i < targetPostIds.length; i += BATCH_SIZE) {
    const chunk = targetPostIds.slice(i, i + BATCH_SIZE);
    await prisma.post.deleteMany({ where: { id: { in: chunk } } });
    const progress = Math.min(i + BATCH_SIZE, targetPostIds.length);
    console.log(`   • Deleted posts: ${progress}/${targetPostIds.length}`);
  }
  console.log(`✅ Deleted all ${targetPostIds.length} Unsplash posts.`);

  // 6. Reconcile postCount for all affected groups
  console.log(`\n🔄 Reconciling postCount for ${affectedGroupIds.length} affected groups...`);
  for (let i = 0; i < affectedGroupIds.length; i++) {
    const groupId = affectedGroupIds[i];
    const actualCount = await prisma.post.count({
      where: {
        groupId,
        parentId: null,
      },
    });

    await prisma.group.update({
      where: { id: groupId },
      data: { postCount: actualCount },
    });

    if ((i + 1) % 50 === 0 || i + 1 === affectedGroupIds.length) {
      console.log(`   • Reconciled: ${i + 1}/${affectedGroupIds.length} groups`);
    }
  }
  console.log('✅ All group post counts reconciled successfully.');

  console.log('\n======================================================');
  console.log('🎉 UNSPLASH IMAGES CLEANUP COMPLETED SUCCESSFULLY!');
  console.log(`🖼️ Deleted Unsplash Posts: ${targetPostIds.length}`);
  console.log(`💬 Deleted Threaded Replies: ${uniqueReplyIds.length}`);
  console.log(`📸 Media Records Removed: ${matchingMedia.length}`);
  console.log(`🏛️ Groups Reconciled: ${affectedGroupIds.length}`);
  console.log('======================================================\n');
}

cleanPostsWithUnsplashImages()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

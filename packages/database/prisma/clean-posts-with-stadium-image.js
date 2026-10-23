const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const TARGET_IMAGE_ID = '1540747913346-19e32dc3e97e';
const TARGET_IMAGE_URL = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000&auto=format&fit=crop&q=80';

async function cleanPostsWithStadiumImage() {
  console.log('================================================================');
  console.log('🧹 REMOVING ALL POSTS CONTAINING TARGET UN splash IMAGE');
  console.log(`🖼️ Target Image ID: ${TARGET_IMAGE_ID}`);
  console.log(`🔗 Target URL: ${TARGET_IMAGE_URL}`);
  console.log('================================================================\n');

  // 1. Find all PostMedia records matching the target image ID or URL
  const matchingMedia = await prisma.postMedia.findMany({
    where: {
      OR: [
        { url: { contains: TARGET_IMAGE_ID } },
        { thumbnailUrl: { contains: TARGET_IMAGE_ID } },
      ],
    },
    select: {
      id: true,
      postId: true,
      url: true,
      thumbnailUrl: true,
    },
  });

  console.log(`Found ${matchingMedia.length} media records matching the target image.`);

  const targetPostIds = [...new Set(matchingMedia.map((m) => m.postId))];
  console.log(`Found ${targetPostIds.length} unique posts containing this image.`);

  if (targetPostIds.length === 0) {
    console.log('✅ No posts found with this image. Database is already clean.');
    return;
  }

  // 2. Find any child replies to these target posts
  const replyPosts = await prisma.post.findMany({
    where: {
      parentId: { in: targetPostIds },
    },
    select: { id: true },
  });
  const replyPostIds = replyPosts.map((r) => r.id);
  console.log(`Found ${replyPostIds.length} threaded replies to these posts.`);

  // 3. Find all affected groups to reconcile postCount later
  const postsWithGroups = await prisma.post.findMany({
    where: {
      id: { in: [...targetPostIds, ...replyPostIds] },
      groupId: { not: null },
    },
    select: { groupId: true },
  });
  const affectedGroupIds = [...new Set(postsWithGroups.map((p) => p.groupId))];
  console.log(`Affected communities/groups to reconcile: ${affectedGroupIds.length}`);

  // 4. Batch delete dependent records for replies and target posts
  const allIdsToDelete = [...replyPostIds, ...targetPostIds];

  console.log('\n🗑️ Deleting associated relations in batches...');
  const BATCH_SIZE = 500;

  for (let i = 0; i < allIdsToDelete.length; i += BATCH_SIZE) {
    const chunk = allIdsToDelete.slice(i, i + BATCH_SIZE);

    await prisma.postMedia.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.like.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.bookmark.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.repost.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.postHashtag.deleteMany({ where: { postId: { in: chunk } } });
    await prisma.mention.deleteMany({ where: { postId: { in: chunk } } });
  }

  // 5. Delete replies first, then target posts
  if (replyPostIds.length > 0) {
    for (let i = 0; i < replyPostIds.length; i += BATCH_SIZE) {
      const chunk = replyPostIds.slice(i, i + BATCH_SIZE);
      await prisma.post.deleteMany({ where: { id: { in: chunk } } });
    }
    console.log(`✅ Deleted ${replyPostIds.length} threaded replies.`);
  }

  for (let i = 0; i < targetPostIds.length; i += BATCH_SIZE) {
    const chunk = targetPostIds.slice(i, i + BATCH_SIZE);
    await prisma.post.deleteMany({ where: { id: { in: chunk } } });
  }
  console.log(`✅ Deleted ${targetPostIds.length} posts containing the image.`);

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
  }
  console.log('✅ All group post counts reconciled successfully.');

  console.log('\n======================================================');
  console.log('🎉 IMAGE POSTS CLEANUP COMPLETED SUCCESSFULLY!');
  console.log(`🖼️ Deleted Image Posts: ${targetPostIds.length}`);
  console.log(`💬 Deleted Threaded Replies: ${replyPostIds.length}`);
  console.log(`📸 Media Records Removed: ${matchingMedia.length}`);
  console.log(`🏛️ Groups Reconciled: ${affectedGroupIds.length}`);
  console.log('======================================================\n');
}

cleanPostsWithStadiumImage()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

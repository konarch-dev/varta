const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

async function cleanJoharJharkhand() {
  console.log('🧹 Clearing all posts from group "VARTA | Johar Jharkhand"...');

  const group = await prisma.group.findFirst({
    where: {
      OR: [
        { name: 'VARTA | Johar Jharkhand' },
        { slug: 'varta-johar-jharkhand' },
      ],
    },
  });

  if (!group) {
    console.error('❌ Group "VARTA | Johar Jharkhand" not found.');
    return;
  }

  const posts = await prisma.post.findMany({
    where: { groupId: group.id },
    select: { id: true },
  });

  const postIds = posts.map((p) => p.id);
  console.log(`Found ${postIds.length} posts to remove.`);

  if (postIds.length > 0) {
    await prisma.postMedia.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.like.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.bookmark.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.repost.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.postHashtag.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.mention.deleteMany({ where: { postId: { in: postIds } } });

    // Delete replies first
    const replies = await prisma.post.deleteMany({
      where: {
        id: { in: postIds },
        parentId: { not: null },
      },
    });

    // Delete root posts
    const roots = await prisma.post.deleteMany({
      where: {
        id: { in: postIds },
      },
    });

    console.log(`✅ Deleted ${replies.count} replies and ${roots.count} root posts.`);
  }

  await prisma.group.update({
    where: { id: group.id },
    data: { postCount: 0 },
  });

  console.log('✅ Group "VARTA | Johar Jharkhand" post count reset to 0.');
}

cleanJoharJharkhand()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

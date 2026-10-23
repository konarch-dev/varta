const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Syncing hashtags from all posts...');

  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    select: { id: true, content: true },
  });

  console.log(`Found ${posts.length} active posts to process.`);

  const tagCounts = new Map();
  const tagPostMap = new Map();

  for (const post of posts) {
    if (!post.content) continue;
    const matches = post.content.match(/#[a-zA-Z0-9_]+/g);
    if (!matches) continue;

    const uniqueTagsInPost = Array.from(
      new Set(matches.map((t) => t.slice(1).toLowerCase()))
    );

    for (const tag of uniqueTagsInPost) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      if (!tagPostMap.has(tag)) {
        tagPostMap.set(tag, new Set());
      }
      tagPostMap.get(tag).add(post.id);
    }
  }

  console.log(`Identified ${tagCounts.size} unique hashtags across posts.`);

  const tagToId = new Map();
  for (const [tag, count] of tagCounts.entries()) {
    const hashtag = await prisma.hashtag.upsert({
      where: { tag },
      update: { usageCount: count },
      create: { tag, usageCount: count },
    });
    tagToId.set(tag, hashtag.id);
  }

  console.log(`✅ Upserted ${tagToId.size} hashtags in database.`);

  const postHashtagRows = [];
  for (const [tag, postIds] of tagPostMap.entries()) {
    const hashtagId = tagToId.get(tag);
    if (!hashtagId) continue;
    for (const postId of postIds) {
      postHashtagRows.push({ postId, hashtagId });
    }
  }

  console.log(`Prepared ${postHashtagRows.length} PostHashtag relations to link.`);

  // Chunked createMany with skipDuplicates
  const chunkSize = 1000;
  for (let i = 0; i < postHashtagRows.length; i += chunkSize) {
    const chunk = postHashtagRows.slice(i, i + chunkSize);
    await prisma.postHashtag.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  console.log(`🎉 Finished syncing all PostHashtag relationships!`);
}

main()
  .catch((e) => {
    console.error('Error syncing hashtags:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

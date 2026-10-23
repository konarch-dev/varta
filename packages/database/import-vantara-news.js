const https = require('https');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const GROUP_SLUG = 'vantara-techno-hub';
const NEWS_URL =
  'https://newsdata.io/api/1/latest?apikey=pub_c072b1df5ced44fab6cfca876f39b4d0&qInTitle=php&country=in&language=en&category=technology';

function fetchNews() {
  return new Promise((resolve, reject) => {
    https
      .get(NEWS_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.status !== 'success') {
              return reject(new Error(`API returned status: ${json.status}`));
            }
            resolve(json.results || []);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function extractHashtags(text) {
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase())));
}

function formatPostContent(item) {
  const source = item.source_name || item.source_id || 'Tech News';
  let title = item.title.trim();
  const link = item.link;
  const hashtags = '#VantaraTechno #PHP #TechNews #CyberSecurity';

  const footer = `\n🔗 ${link} ${hashtags}`;

  // Ensure total fits in 490 chars (Post content is db.VarChar(500))
  let maxHeaderAndDesc = 490 - footer.length;
  let header = `⚡ TECH: ${title} [via ${source}]\n\n`;

  if (header.length > maxHeaderAndDesc - 30) {
    // Truncate title if title is exceptionally long
    const allowedTitleLen = maxHeaderAndDesc - `⚡ TECH:  [via ${source}]\n\n`.length - 40;
    title = title.slice(0, Math.max(allowedTitleLen, 40)) + '...';
    header = `⚡ TECH: ${title} [via ${source}]\n\n`;
  }

  const remainingForDesc = maxHeaderAndDesc - header.length;
  let desc = (item.description || item.content || '').trim().replace(/\s+/g, ' ');

  if (desc && remainingForDesc > 40) {
    if (desc.length > remainingForDesc) {
      desc = desc.slice(0, remainingForDesc - 4) + '...';
    }
    return `${header}${desc}${footer}`;
  }

  return `${header.trim()}${footer}`;
}

async function main() {
  console.log(`🔍 Looking up group "${GROUP_SLUG}" in database...`);
  const group = await prisma.group.findUnique({
    where: { slug: GROUP_SLUG },
    include: {
      creator: true,
    },
  });

  if (!group) {
    throw new Error(`Group with slug "${GROUP_SLUG}" not found!`);
  }

  console.log(`✅ Found group: "${group.name}" (ID: ${group.id})`);
  const authorId = group.creatorId;
  console.log(`👤 Using author: "${group.creator?.username}" (${authorId})`);

  console.log('🌐 Fetching latest PHP technology news from NewsData.io...');
  const articles = await fetchNews();
  console.log(`📰 Received ${articles.length} articles from API.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < articles.length; i++) {
    const item = articles[i];
    const content = formatPostContent(item);

    if (content.length > 500) {
      console.warn(`⚠️ Warning: formatted content length is ${content.length} (>500), trimming...`);
    }

    const safeContent = content.slice(0, 500);

    // Check if post with this link already exists in the group
    const existingPost = await prisma.post.findFirst({
      where: {
        groupId: group.id,
        content: {
          contains: item.link,
        },
        deletedAt: null,
      },
    });

    if (existingPost) {
      console.log(`⏭️  Skipping article ${i + 1} (already posted): "${item.title.slice(0, 50)}..."`);
      skippedCount++;
      continue;
    }

    // Determine post creation date from article pubDate if available
    let postDate = new Date();
    if (item.pubDate) {
      const parsed = new Date(item.pubDate);
      if (!isNaN(parsed.getTime())) {
        postDate = parsed;
      }
    }

    // Create post transactionally
    await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId,
          groupId: group.id,
          content: safeContent,
          createdAt: postDate,
          ...(item.image_url && {
            media: {
              create: [
                {
                  url: item.image_url,
                  thumbnailUrl: item.image_url,
                  type: 'IMAGE',
                  mimeType: 'image/jpeg',
                  sizeBytes: 1024 * 120,
                  order: 0,
                },
              ],
            },
          }),
        },
      });

      // Handle hashtags
      const tags = extractHashtags(safeContent);
      for (const tag of tags) {
        const hashtag = await tx.hashtag.upsert({
          where: { tag },
          update: { usageCount: { increment: 1 } },
          create: { tag, usageCount: 1 },
        });

        await tx.postHashtag.create({
          data: {
            postId: post.id,
            hashtagId: hashtag.id,
          },
        });
      }

      console.log(`✨ Created Post [${i + 1}/${articles.length}]: "${item.title.slice(0, 60)}..."`);
      console.log(`   ID: ${post.id} | Media: ${item.image_url ? 'Yes' : 'No'} | Chars: ${safeContent.length}`);
      createdCount++;
    });
  }

  // Update group postCount
  if (createdCount > 0) {
    const totalPostsInGroup = await prisma.post.count({
      where: { groupId: group.id, deletedAt: null },
    });

    await prisma.group.update({
      where: { id: group.id },
      data: { postCount: totalPostsInGroup },
    });
    console.log(`📈 Updated group total postCount to: ${totalPostsInGroup}`);
  }

  console.log(`\n🎉 Summary: ${createdCount} posts created, ${skippedCount} skipped.`);
}

main()
  .catch((err) => {
    console.error('❌ Error importing news:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

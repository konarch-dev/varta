const path = require('path');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const NEWSDATA_ASSAM_URL =
  'https://newsdata.io/api/1/latest?apikey=pub_f6d491c00a0d49d699d15811ca828e31&qInTitle=assam&country=in&language=as,en&category=breaking,domestic,crime,top,politics';

const ASSAM_COMMENTS_EN = [
  'Critical breaking update from Assam. Thanks for keeping the community informed 📰',
  'Law and order, citizen safety, and transparent investigations must remain the top priorities.',
  'Appreciate VARTA Axom Xomaj for verified reporting with the original source link!',
  'Important development. Following closely as further official statements emerge.',
  'Guwahati and upper Assam infrastructure and governance developments are crucial. ⚖️',
  'Brahmaputra valley protection and public welfare should always be front and center. 🌿',
];

const ASSAM_COMMENTS_AS = [
  'অসমৰ শেহতীয়া আৰু গুৰুত্বপূৰ্ণ খবৰৰ বাবে ধন্যবাদ। 🦏',
  'ৰাজ্যখনৰ শান্তি-শৃংখলা আৰু জনসাধাৰণৰ নিৰাপত্তা সদায় প্ৰথম অগ্ৰাধিকাৰ হোৱা উচিত।',
  'ব্ৰহ্মপুত্ৰ উপত্যকা আৰু গুৱাহাটীৰ উন্নয়নমূলক বাতৰি অতি প্ৰয়োজনীয়।',
  'সঠিক বাতৰিৰ উৎস লিংক (Source link) দিয়াৰ বাবে ধন্যবাদ!',
  'অসমৰ প্ৰাকৃতিক সম্পদ আৰু ঐতিহ্য ৰক্ষা কৰাটো আমাৰ সকলোৰে দায়িত্ব। 🌿',
  'গুৱাহাটী আৰু সকলো জিলাৰ যোগাযোগ ব্যৱস্থা উন্নত হোৱাটো শুভ লক্ষণ। 🌟',
];

function fetchJson(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaAxomXomaj/1.0 (Windows NT 10.0; Win64; x64)',
            Accept: 'application/json',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (err) {
              resolve({});
            }
          });
        }
      )
      .on('error', () => resolve({}));
  });
}

async function fetchAllAssamArticles(maxPages = 7) {
  console.log(`📡 Fetching live Assam news from Newsdata.io API (up to ${maxPages} pages)...`);
  const articles = [];
  let nextPageToken = null;

  for (let page = 1; page <= maxPages; page++) {
    let url = NEWSDATA_ASSAM_URL;
    if (nextPageToken) {
      url += `&page=${encodeURIComponent(nextPageToken)}`;
    }

    try {
      console.log(`   • Fetching page ${page}...`);
      const response = await fetchJson(url);

      if (response.status !== 'success' || !response.results) {
        console.warn(`   ⚠️ Warning: Page ${page} returned status:`, response.status);
        break;
      }

      console.log(`   ✅ Page ${page} returned ${response.results.length} articles.`);
      articles.push(...response.results);

      nextPageToken = response.nextPage;
      if (!nextPageToken) {
        console.log('   ℹ️ No further pages available.');
        break;
      }
    } catch (err) {
      console.error(`   ❌ Error fetching page ${page}:`, err.message);
      break;
    }
  }

  // Deduplicate articles by article_id or title
  const seen = new Set();
  const uniqueArticles = [];
  for (const a of articles) {
    const key = a.article_id || a.title;
    if (key && !seen.has(key) && a.title && a.title.trim().length > 3) {
      seen.add(key);
      uniqueArticles.push(a);
    }
  }

  console.log(`✅ Total unique Assam news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatAssamPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #AxomXomaj #Assam #AssamNews #Guwahati #Brahmaputra #IndiaTrends';
  const prefix = '🦏 ASSAM: ';
  const sourcePart = sourceName ? ` [via ${sourceName}]` : '';
  const linkPart = link ? `\n🔗 ${link}` : '';

  const header = `${prefix}${title.trim()}${sourcePart}`;
  const footer = `${linkPart}${hashtags}`;

  const overhead = header.length + footer.length + 2;
  const remainingForDesc = MAX_CONTENT_LENGTH - overhead;

  let descText = '';
  if (description && description.trim() && remainingForDesc > 40) {
    descText = `\n\n${description.trim()}`;
    if (descText.length > remainingForDesc) {
      descText = `\n\n${description.trim().slice(0, remainingForDesc - 4)}...`;
    }
  }

  let finalContent = `${header}${descText}${footer}`;
  if (finalContent.length > MAX_CONTENT_LENGTH) {
    const overflow = finalContent.length - MAX_CONTENT_LENGTH;
    const truncatedTitle = title.trim().slice(0, Math.max(20, title.trim().length - overflow - 5)) + '...';
    finalContent = `${prefix}${truncatedTitle}${sourcePart}${descText}${footer}`;
  }

  return finalContent.slice(0, MAX_CONTENT_LENGTH);
}

async function main() {
  console.log('================================================================');
  console.log('🚀 SEEDING "VARTA | AXOM XOMAJ" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllAssamArticles(7);
  if (articles.length === 0) {
    console.error('❌ No articles retrieved from API! Check network connection or API status.');
    process.exit(1);
  }

  // 2. Fetch users from DB
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });

  if (users.length === 0) {
    console.error('❌ No users found in database! Please run `npm run db:seed:users` first.');
    process.exit(1);
  }

  const rakaUser = users.find((u) => u.username === 'raka92');

  // 3. Upsert official desk user @axom_xomaj
  console.log('👤 Ensuring official desk account "@axom_xomaj" exists...');
  let assamUser = await prisma.user.findUnique({
    where: { username: 'axom_xomaj' },
    include: { profile: true },
  });

  const assamUserData = {
    email: 'assam@varta.in',
    username: 'axom_xomaj',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const assamProfileData = {
    displayName: 'VARTA Axom Xomaj 🦏',
    bio: 'Official Assam News & Culture desk of VARTA. Real-time updates, Brahmaputra valley, Guwahati, Kaziranga, tea industry, politics, breaking stories & Assamese culture. #AxomXomaj #Assam',
    avatarUrl:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=1200&auto=format&fit=crop&q=80',
    location: 'Guwahati, Assam',
    website: 'https://newsdata.io',
  };

  if (!assamUser) {
    assamUser = await prisma.user.create({
      data: {
        ...assamUserData,
        profile: {
          create: assamProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@axom_xomaj" user (ID: ${assamUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: assamUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: assamUser.id },
      update: assamProfileData,
      create: { ...assamProfileData, userId: assamUser.id },
    });
    console.log(`✅ Verified existing "@axom_xomaj" user (ID: ${assamUser.id})`);
  }

  // 4. Find or create group "VARTA | Axom Xomaj" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Axom Xomaj" in "India Trends"...');
  const groupSlug = 'varta-axom-xomaj';
  const groupData = {
    name: 'VARTA | Axom Xomaj',
    slug: groupSlug,
    description:
      'The vibrant heart of Assam! Celebrating Rongali Bihu rhythms, Kaziranga one-horned rhinos, lush emerald tea estates, the mighty Brahmaputra, Sualkuchi golden Muga silk, and Guwahati innovation.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=1200&auto=format&fit=crop&q=80',
    creatorId: assamUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Axom Xomaj" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Axom Xomaj" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Axom Xomaj...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === assamUser.id)) {
    memberCandidates.push(assamUser);
  }

  for (const m of memberCandidates) {
    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: m.id,
        },
      },
      update: {},
      create: {
        groupId: group.id,
        userId: m.id,
        role: m.id === assamUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Axom Xomaj now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Assam news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @axom_xomaj, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? assamUser : getRandomElement([assamUser, ...memberCandidates]);

    const postContent = formatAssamPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across the last 36 hours
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 28 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 95) + 35;
    const repostCount = Math.floor(Math.random() * 30) + 8;
    const bookmarkCount = Math.floor(Math.random() * 22) + 5;

    // Attach media: whatever this API provides for each post (image and/or video)
    const mediaToCreate = [];

    // 1. If API provides image_url
    if (
      article.image_url &&
      typeof article.image_url === 'string' &&
      article.image_url.startsWith('http')
    ) {
      mediaToCreate.push({
        type: 'IMAGE',
        url: article.image_url,
        thumbnailUrl: article.image_url,
        mimeType: 'image/jpeg',
        sizeBytes: 1200000,
        width: 1200,
        height: 800,
        order: 0,
        createdAt: postDate,
      });
      imageCount++;
    }

    // 2. If API provides video_url
    if (
      article.video_url &&
      typeof article.video_url === 'string' &&
      article.video_url.startsWith('http')
    ) {
      mediaToCreate.push({
        type: 'VIDEO',
        url: article.video_url,
        thumbnailUrl: article.image_url || null,
        mimeType: 'video/mp4',
        sizeBytes: 8500000,
        width: 1280,
        height: 720,
        order: mediaToCreate.length,
        createdAt: postDate,
      });
      videoCount++;
    }

    if (mediaToCreate.length === 0) {
      textOnlyCount++;
    }

    try {
      const post = await prisma.post.create({
        data: {
          authorId: author.id,
          groupId: group.id,
          content: postContent,
          likeCount,
          repostCount,
          replyCount: 0,
          bookmarkCount,
          createdAt: postDate,
          updatedAt: postDate,
          ...(mediaToCreate.length > 0 && {
            media: {
              create: mediaToCreate,
            },
          }),
        },
      });

      createdPosts.push(post);
    } catch (err) {
      console.warn(`   ⚠️ Skipped post ${idx + 1} due to error:`, err.message);
    }
  }

  console.log(`✅ Successfully seeded ${createdPosts.length} posts!`);
  console.log(`   📸 Posts with image: ${imageCount}`);
  console.log(`   🎥 Posts with video: ${videoCount}`);
  console.log(`   📝 Text-only posts: ${textOnlyCount}`);

  // 8. Seed threaded discussion comments
  console.log('\n💬 Generating bilingual discussion comments...');
  let commentCount = 0;

  for (let i = 0; i < createdPosts.length; i++) {
    const parentPost = createdPosts[i];
    // Attach 1 to 2 comments on most posts
    const numComments = Math.random() < 0.85 ? (Math.random() < 0.4 ? 2 : 1) : 0;

    for (let c = 0; c < numComments; c++) {
      const isAssamese = Math.random() < 0.5;
      const commentPool = isAssamese ? ASSAM_COMMENTS_AS : ASSAM_COMMENTS_EN;
      const commentText = getRandomElement(commentPool);

      const commenter =
        getRandomElement(memberCandidates.filter((u) => u.id !== parentPost.authorId)) ||
        rakaUser ||
        users[0];

      const commentDate = new Date(parentPost.createdAt.getTime() + (c + 1) * 15 * 60 * 1000);

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            parentId: parentPost.id,
            groupId: group.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 20) + 3,
            repostCount: 0,
            replyCount: 0,
            bookmarkCount: 0,
            createdAt: commentDate,
            updatedAt: commentDate,
          },
        });

        await prisma.post.update({
          where: { id: parentPost.id },
          data: {
            replyCount: {
              increment: 1,
            },
          },
        });

        commentCount++;
      } catch (err) {
        // Skip comment error
      }
    }
  }

  console.log(`✅ Seeded ${commentCount} threaded community comments.`);

  // 9. Update Group metrics
  const totalRootPosts = await prisma.post.count({
    where: { groupId: group.id, parentId: null },
  });

  await prisma.group.update({
    where: { id: group.id },
    data: {
      memberCount: enrolledMemberCount,
      postCount: totalRootPosts,
    },
  });

  console.log('\n======================================================');
  console.log('🎉 "VARTA | AXOM XOMAJ" LIVE FEED SEEDING COMPLETE!');
  console.log(`🏛️ Group: ${group.name} (${group.slug})`);
  console.log(`📂 Category: ${group.category}`);
  console.log(`👥 Members: ${enrolledMemberCount}`);
  console.log(`📝 Live News Posts: ${totalRootPosts}`);
  console.log(`💬 Threaded Comments: ${commentCount}`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

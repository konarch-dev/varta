const path = require('path');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const API_KEY = process.env.NEWSDATA_API_KEY || 'pub_c072b1df5ced44fab6cfca876f39b4d0';

// Exact primary URL requested by the user
const PRIMARY_URL =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=Tripura&country=in&language=bn,en&category=breaking,domestic,crime,top,politics';

// Google News live RSS fallback endpoints for Tripura in Bengali and English
const RSS_URLS = [
  'https://news.google.com/rss/search?q=Tripura+Agartala+politics+governance+development&hl=en-IN&gl=IN&ceid=IN:en',
  'https://news.google.com/rss/search?q=' + encodeURIComponent('ত্রিপুরা আগরতলা') + '&hl=bn&gl=IN&ceid=IN:bn',
  'https://news.google.com/rss/search?q=Tripura+Neermahal+Unakoti+smart+city&hl=en-IN&gl=IN&ceid=IN:en',
  'https://news.google.com/rss/search?q=' + encodeURIComponent('ত্রিপুরা প্রশাসন উন্নয়ন') + '&hl=bn&gl=IN&ceid=IN:bn',
];

const TRIPURA_STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80',
];

const TRIPURA_COMMENTS = [
  'উজ্বয়ন্ত প্রাসাদ, নীরমহল ও ঊনকোটির ঐতিহাসিক ভাস্কর্য ত্রিপুরার সমৃদ্ধ ইতিহাসের অহংকার। 🏰✨',
  'Agartala smart city initiatives, broad-gauge railway, and border trade connectivity are transforming Tripura rapidly. 🛣️',
  'ত্রিপুরা সুন্দরী মন্দির ও মাতাবাড়ির দর্শন প্রতিটি ভক্তের মনে ভক্তি ও শান্তি সঞ্চার করে। 🙏',
  'Queen Pineapple and natural rubber production continue to empower local farmers and indigenous tribal communities. 🍍🌿',
  'আইন-শৃঙ্খলা ও প্রশাসনিক দ্রুত পদক্ষেপ সাধারণ মানুষের নিরাপত্তা বৃদ্ধি করেছে। ⚖️',
  'Authentic reporting and direct source attribution from Tripura Connect desk. Proud of our state! 📰',
  'শিক্ষা, স্বাস্থ্য এবং গ্রামীণ জনজাতি অঞ্চলের সার্বিক পরিকাঠামো উন্নয়ন অত্যন্ত প্রশংসনীয়। 🌟',
  'ককবরক ভাষা ও ঐতিহ্যবাহী রিয়া এবং পাছড়ার হস্তশিল্প আমাদের আসল সাংস্কৃতিক পরিচয়। 🧵',
];

function fetchHttps(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaTripuraConnect/1.0 (Windows NT 10.0; Win64; x64)',
            Accept: '*/*',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        }
      )
      .on('error', (err) => resolve({ statusCode: 500, body: '', error: err.message }));
  });
}

function parseRssXml(xmlString) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xmlString)) !== null) {
    const itemStr = match[1];
    let title = (itemStr.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    title = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&').trim();

    let link = (itemStr.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    link = link.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();

    let pubDate = (itemStr.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    pubDate = pubDate.trim();

    let source = (itemStr.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';
    source = source.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();

    if (title && title.length > 5) {
      items.push({
        title,
        link,
        pubDate,
        source_name: source || 'Tripura News Desk',
        description: `Tripura regional news covering governance, cultural heritage, and developmental progress from ${source || 'regional news sources'}.`,
        image_url: null,
      });
    }
  }
  return items;
}

async function fetchAllTripuraArticles(targetCount = 46) {
  console.log('📡 Fetching live Tripura news...');
  const uniqueArticles = [];
  const seenKeys = new Set();

  function addArticles(list) {
    if (!Array.isArray(list)) return;
    for (const a of list) {
      const key = a.article_id || a.title;
      if (key && !seenKeys.has(key) && a.title && a.title.trim().length > 3) {
        seenKeys.add(key);
        uniqueArticles.push(a);
      }
    }
  }

  // 1. First attempt user-requested Newsdata.io primary URL across pages
  console.log('   • Calling primary user-specified URL on Newsdata.io...');
  try {
    let nextToken = null;
    for (let p = 1; p <= 6; p++) {
      let u = PRIMARY_URL;
      if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
      const res = await fetchHttps(u);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
          console.log(`     ✅ Newsdata.io Page ${p} returned ${json.results.length} articles.`);
          addArticles(json.results);
          nextToken = json.nextPage;
          if (!nextToken || uniqueArticles.length >= targetCount) break;
        } else if (json.status === 'error') {
          console.warn(`     ⚠️ Newsdata.io Notice: ${json.results?.message || json.status}`);
          break;
        } else {
          break;
        }
      } else {
        console.warn(`     ⚠️ Newsdata.io returned status ${res.statusCode}`);
        break;
      }
    }
  } catch (err) {
    console.warn('     ⚠️ Primary URL error:', err.message);
  }

  // 2. Resilient live RSS fallback (Google News IN Bengali & English feeds)
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Ingesting live Tripura news feeds in Bengali and English (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    for (const rssUrl of RSS_URLS) {
      try {
        const res = await fetchHttps(rssUrl);
        if (res.statusCode === 200 && res.body) {
          const rssArticles = parseRssXml(res.body);
          console.log(`     ✅ Feed returned ${rssArticles.length} live articles.`);
          addArticles(rssArticles);
          if (uniqueArticles.length >= targetCount) break;
        }
      } catch (err) {
        // continue
      }
    }
  }

  console.log(`✅ Total unique Tripura news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles.slice(0, targetCount);
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatTripuraPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #TripuraConnect #Tripura #Agartala #Neermahal #Unakoti #IndiaTrends';
  const prefix = '🏰 TRIPURA: ';
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
  console.log('🚀 SEEDING "VARTA | TRIPURA CONNECT" WITH LIVESTREAM NEWS FEED');
  console.log('================================================================\n');

  // 1. Fetch live articles
  const articles = await fetchAllTripuraArticles(46);
  if (articles.length === 0) {
    console.error('❌ No articles retrieved! Check network connection.');
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

  // 3. Upsert official desk user @tripura_connect
  console.log('👤 Ensuring official desk account "@tripura_connect" exists...');
  let tripuraUser = await prisma.user.findUnique({
    where: { username: 'tripura_connect' },
    include: { profile: true },
  });

  const tripuraUserData = {
    email: 'tripura@varta.in',
    username: 'tripura_connect',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const tripuraProfileData = {
    displayName: 'VARTA Tripura Connect 🏰🌸',
    bio: 'Official Tripura Desk of VARTA. চতুর্দশ দেবতার পুণ্যভূমি! Real-time updates from Agartala, Neermahal, Unakoti, rubber plantations, Queen pineapple, Kokborok & Bengali culture. #TripuraConnect',
    avatarUrl:
      'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    location: 'Agartala, Tripura',
    website: 'https://newsdata.io',
  };

  if (!tripuraUser) {
    tripuraUser = await prisma.user.create({
      data: {
        ...tripuraUserData,
        profile: {
          create: tripuraProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@tripura_connect" user (ID: ${tripuraUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: tripuraUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: tripuraUser.id },
      update: tripuraProfileData,
      create: { ...tripuraProfileData, userId: tripuraUser.id },
    });
    console.log(`✅ Verified existing "@tripura_connect" user (ID: ${tripuraUser.id})`);
  }

  // 4. Find or create group "VARTA | Tripura Connect" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Tripura Connect" in "India Trends"...');
  const groupSlug = 'varta-tripura-connect';
  const groupData = {
    name: 'VARTA | Tripura Connect',
    slug: groupSlug,
    description:
      'Land of Fourteen Gods! The floating Neermahal Water Palace, historic Ujjayanta Palace in Agartala, rock-cut bas-reliefs of Unakoti, bamboo handicraft excellence, and eco-tourism.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    creatorId: tripuraUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Tripura Connect" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Tripura Connect" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Tripura Connect...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === tripuraUser.id)) {
    memberCandidates.push(tripuraUser);
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
        role: m.id === tripuraUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Tripura Connect now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts
  console.log(`\n📝 Inserting ${articles.length} live Tripura news posts...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @tripura_connect, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? tripuraUser : getRandomElement([tripuraUser, ...memberCandidates]);

    const postContent = formatTripuraPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across recent days
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 25 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 110) + 35;
    const repostCount = Math.floor(Math.random() * 30) + 8;
    const bookmarkCount = Math.floor(Math.random() * 22) + 5;

    // Attach media: whatever this API / feed provides, or curated high-res photo
    const mediaToCreate = [];

    const effectiveImageUrl =
      article.image_url && typeof article.image_url === 'string' && article.image_url.startsWith('http')
        ? article.image_url
        : TRIPURA_STOCK_IMAGES[idx % TRIPURA_STOCK_IMAGES.length];

    if (effectiveImageUrl) {
      mediaToCreate.push({
        type: 'IMAGE',
        url: effectiveImageUrl,
        thumbnailUrl: effectiveImageUrl,
        mimeType: 'image/jpeg',
        sizeBytes: 1200000,
        width: 1200,
        height: 800,
        order: 0,
        createdAt: postDate,
      });
      imageCount++;
    }

    // If video_url is present
    if (
      article.video_url &&
      typeof article.video_url === 'string' &&
      article.video_url.startsWith('http')
    ) {
      mediaToCreate.push({
        type: 'VIDEO',
        url: article.video_url,
        thumbnailUrl: effectiveImageUrl,
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
  console.log('\n💬 Generating discussion comments...');
  let commentCount = 0;

  for (let i = 0; i < createdPosts.length; i++) {
    const parentPost = createdPosts[i];
    const numComments = Math.random() < 0.85 ? (Math.random() < 0.4 ? 2 : 1) : 0;

    for (let c = 0; c < numComments; c++) {
      const commentText = getRandomElement(TRIPURA_COMMENTS);

      const commenter =
        getRandomElement(memberCandidates.filter((u) => u.id !== parentPost.authorId)) ||
        rakaUser ||
        users[0];

      const commentDate = new Date(parentPost.createdAt.getTime() + (c + 1) * 16 * 60 * 1000);

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            parentId: parentPost.id,
            groupId: group.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 24) + 4,
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
  console.log('🎉 "VARTA | TRIPURA CONNECT" LIVE FEED SEEDING COMPLETE!');
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

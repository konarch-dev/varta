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
  '&qInTitle=Karnataka&country=in&language=kn&category=breaking,domestic,crime,top,politics';

// Supplementary URLs for full Kannada news coverage
const SUPPLEMENTARY_URL_TITLE_KN =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=' +
  encodeURIComponent('ಕರ್ನಾಟಕ') +
  '&country=in&language=kn&category=breaking,domestic,crime,top,politics';

const SUPPLEMENTARY_URL_QUERY =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&q=karnataka&country=in&language=kn&category=breaking,domestic,crime,top,politics';

const SUPPLEMENTARY_URL_BENGALURU =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=bengaluru&country=in&language=kn&category=breaking,domestic,crime,top,politics';

const KANNADA_COMMENTS_KN = [
  'ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ! ಕರ್ನಾಟಕದ ಸಮಗ್ರ ಅಭಿವೃದ್ಧಿ, ಶಾಂತಿ ಮತ್ತು ಸಮೃದ್ಧಿಗಾಗಿ ನಮ್ಮ ಹಾರೈಕೆಗಳು. 💛❤️🚩',
  'ರೈತ ಬಾಂಧವರ ಹಿತರಕ್ಷಣೆ, ನೀರಾವರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಬೆಳೆ ನಷ್ಟ ಪರಿಹಾರಕ್ಕೆ ಸರ್ಕಾರ ಹೆಚ್ಚಿನ ಆದ್ಯತೆ ನೀಡಬೇಕು. 🌾🚜',
  'ಬೆಂಗಳೂರು, ಮೈಸೂರು, ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ ಮತ್ತು ಮಂಗಳೂರು ನಗರಗಳ ಮೂಲಸೌಕರ್ಯ, ರಸ್ತೆ ಹಾಗೂ ಸಾರಿಗೆ ವ್ಯವಸ್ಥೆ ಇನ್ನಷ್ಟು ಸುಧಾರಿಸಲಿ. 🛣️🚇',
  'ವಿಶ್ವಾಸಾರ್ಹ, ಸತ್ಯನಿಷ್ಠ ಮತ್ತು ಕ್ಷಣ ಕ್ಷಣದ ತಾಜಾ ಕನ್ನಡ ಸುದ್ದಿಗಳನ್ನು ತಲುಪಿಸುತ್ತಿರುವ ನಮ್ಮ ಕರ್ನಾಟಕ ಡೆಸ್ಕ್‌ಗೆ ಧನ್ಯವಾದಗಳು! 📰⭐',
  'ಕರ್ನಾಟಕದ ಭವ್ಯ ಪರಂಪರೆ, ಹಂಪಿ-ಬೇಲೂರು ವಾಸ್ತುಶಿಲ್ಪ ಮತ್ತು ಕನ್ನಡ ಸಾಹಿತ್ಯ-ಸಂಸ್ಕೃತಿ ನಮ್ಮ ಹೆಮ್ಮೆ. 🙏🏛️',
  'ರಾಜ್ಯದ ಯುವಜನತೆಗೆ ಸ್ಥಳೀಯ ಉದ್ಯೋಗಾವಕಾಶಗಳು, ಕೌಶಲ್ಯ ತರಬೇತಿ ಮತ್ತು ಐಟಿ-ಸ್ಟಾರ್ಟ್‌ಅಪ್ ಬೆಳವಣಿಗೆ ಬಹಳ ಮುಖ್ಯ. 💻🏢',
  'ಕಾನೂನು ಮತ್ತು ಸುವ್ಯವಸ್ಥೆ ಪಾಲನೆಯಲ್ಲಿ ಪೊಲೀಸ್ ಇಲಾಖೆಯ ತ್ವರಿತ ಕ್ರಮ ಮತ್ತು ಮುನ್ನೆಚ್ಚರಿಕೆ ನಿಜಕ್ಕೂ ಶ್ಲಾಘನೀಯ. ⚖️🛡️',
  'ಶಿಕ್ಷಣ, ಕ್ರೀಡೆ ಮತ್ತು ಆರೋಗ್ಯ ಸೇವೆಗಳು ರಾಜ್ಯದ ಪ್ರತಿಯೊಂದು ಗ್ರಾಮೀಣ ಭಾಗಕ್ಕೂ ಸಮರ್ಪಕವಾಗಿ ತಲುಪುವಂತಾಗಲಿ. 🏅📚',
];

function fetchHttps(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaNammaKarnataka/1.0 (Windows NT 10.0; Win64; x64)',
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

async function fetchAllKarnatakaArticles(targetCount = 45) {
  console.log('📡 Fetching live Karnataka news in Kannada from Newsdata.io API...');
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

  // 1. Fetch from exact user-requested primary URL
  console.log('   • Calling primary user-specified URL (qInTitle=Karnataka & language=kn)...');
  try {
    const res = await fetchHttps(PRIMARY_URL);
    if (res.statusCode === 200) {
      const json = JSON.parse(res.body);
      if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
        console.log(`     ✅ Primary URL returned ${json.results.length} articles.`);
        addArticles(json.results);
      }
    }
  } catch (e) {
    console.warn('     ⚠️ Primary URL fetch notice:', e.message);
  }

  // 2. Fetch from qInTitle=ಕರ್ನಾಟಕ (Kannada script)
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing with qInTitle=ಕರ್ನಾಟಕ (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      const res = await fetchHttps(SUPPLEMENTARY_URL_TITLE_KN);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
          console.log(`     ✅ qInTitle=ಕರ್ನಾಟಕ returned ${json.results.length} articles.`);
          addArticles(json.results);
        }
      }
    } catch (err) {
      // continue
    }
  }

  // 3. Fetch from q=karnataka with pagination
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Paginating through q=karnataka (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 5; p++) {
        let u = SUPPLEMENTARY_URL_QUERY;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchHttps(u);
        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
            console.log(`     ✅ q=karnataka Page ${p} returned ${json.results.length} articles.`);
            addArticles(json.results);
            nextToken = json.nextPage;
            if (!nextToken || uniqueArticles.length >= targetCount) break;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    } catch (err) {
      // continue
    }
  }

  // 4. Supplement if needed with qInTitle=bengaluru
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing coverage with qInTitle=bengaluru (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      const res = await fetchHttps(SUPPLEMENTARY_URL_BENGALURU);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
          console.log(`     ✅ qInTitle=bengaluru returned ${json.results.length} articles.`);
          addArticles(json.results);
        }
      }
    } catch (err) {
      // continue
    }
  }

  console.log(`✅ Total unique Karnataka Kannada news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles.slice(0, targetCount);
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatKarnatakaPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #NammaKarnataka #Karnataka #Bengaluru #Mysuru #KarnatakaNews #IndiaTrends';
  const prefix = '💛❤️ ನಮ್ಮ ಕರ್ನಾಟಕ: ';
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
  console.log('🚀 SEEDING "VARTA | NAMMA KARNATAKA" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllKarnatakaArticles(45);
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
  const aaravUser = users.find((u) => u.username === 'aarav_sharma');
  const vikramUser = users.find((u) => u.username === 'vikram_aditya');
  const poojaUser = users.find((u) => u.username === 'pooja_hegde_ux');
  const divyaUser = users.find((u) => u.username === 'divya_spandana_tech');

  // 3. Upsert official desk user @namma_karnataka
  console.log('👤 Ensuring official desk account "@namma_karnataka" exists...');
  let knUser = await prisma.user.findUnique({
    where: { username: 'namma_karnataka' },
    include: { profile: true },
  });

  const knUserData = {
    email: 'namma_karnataka@varta.in',
    username: 'namma_karnataka',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const knProfileData = {
    displayName: 'VARTA Namma Karnataka 💛❤️',
    bio: 'Official Karnataka News & Culture Desk of VARTA. ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! Real-time updates from Bengaluru, Mysuru, Hubballi, Mangaluru, Belagavi, tech, governance, agriculture, and Kannada heritage. #NammaKarnataka',
    avatarUrl:
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&auto=format&fit=crop&q=80',
    location: 'Bengaluru, Karnataka',
    website: 'https://newsdata.io',
  };

  if (!knUser) {
    knUser = await prisma.user.create({
      data: {
        ...knUserData,
        profile: {
          create: knProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@namma_karnataka" user (ID: ${knUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: knUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: knUser.id },
      update: knProfileData,
      create: { ...knProfileData, userId: knUser.id },
    });
    console.log(`✅ Verified existing "@namma_karnataka" user (ID: ${knUser.id})`);
  }

  // 4. Find or update group "VARTA | Namma Karnataka" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Namma Karnataka" in "India Trends"...');
  const groupSlug = 'varta-namma-karnataka';
  const groupData = {
    name: 'VARTA | Namma Karnataka',
    slug: groupSlug,
    description:
      'ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! Silicon Valley of India (Bengaluru), royal Mysore Dasara, architectural wonders of Hampi & Belur, lush Coorg coffee plantations, Yakshagana theater, and Kannada pride.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&auto=format&fit=crop&q=80',
    creatorId: knUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findFirst({
    where: {
      OR: [
        { slug: groupSlug },
        { name: 'VARTA | Namma Karnataka' },
      ],
    },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Namma Karnataka" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Namma Karnataka" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Namma Karnataka...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  const priorityUsers = [knUser, rakaUser, aaravUser, vikramUser, poojaUser, divyaUser].filter(Boolean);

  for (const pu of priorityUsers) {
    if (!memberCandidates.some((u) => u.id === pu.id)) {
      memberCandidates.push(pu);
    }
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
        role: m.id === knUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Namma Karnataka now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  const existingPosts = await prisma.post.findMany({
    where: { groupId: group.id },
    select: { id: true },
  });
  const existingPostIds = existingPosts.map((p) => p.id);

  if (existingPostIds.length > 0) {
    await prisma.postMedia.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.like.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.bookmark.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.repost.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.postHashtag.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.mention.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.post.deleteMany({ where: { id: { in: existingPostIds }, parentId: { not: null } } });
    await prisma.post.deleteMany({ where: { id: { in: existingPostIds } } });
  }

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Karnataka news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @namma_karnataka, with occasional local reporters/citizens
    const authorPool = [knUser, aaravUser, vikramUser, poojaUser, divyaUser, ...memberCandidates].filter(Boolean);
    const author = idx % 2 === 0 ? knUser : getRandomElement(authorPool);

    const postContent = formatKarnatakaPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across recent hours / days
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 24 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 140) + 40;
    const repostCount = Math.floor(Math.random() * 38) + 12;
    const bookmarkCount = Math.floor(Math.random() * 30) + 7;

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
  console.log('\n💬 Generating discussion comments...');
  let commentCount = 0;

  for (let i = 0; i < createdPosts.length; i++) {
    const parentPost = createdPosts[i];
    const numComments = Math.random() < 0.85 ? (Math.random() < 0.4 ? 2 : 1) : 0;

    for (let c = 0; c < numComments; c++) {
      const commentText = getRandomElement(KANNADA_COMMENTS_KN);

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
            likeCount: Math.floor(Math.random() * 30) + 5,
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
  console.log('🎉 "VARTA | NAMMA KARNATAKA" LIVE FEED SEEDING COMPLETE!');
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

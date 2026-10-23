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
  '&qInTitle=maharastra&country=in&language=mr&category=breaking,domestic,crime,top,politics';

// Supplementary URLs for full Marathi news coverage
const SUPPLEMENTARY_URL_TITLE =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=maharashtra&country=in&language=mr&category=breaking,domestic,crime,top,politics';

const SUPPLEMENTARY_URL_TITLE_MR =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=' +
  encodeURIComponent('महाराष्ट्र') +
  '&country=in&language=mr&category=breaking,domestic,crime,top,politics';

const SUPPLEMENTARY_URL_QUERY =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&q=maharashtra&country=in&language=mr&category=breaking,domestic,crime,top,politics';

const MAHARASHTRA_COMMENTS_MR = [
  'जय महाराष्ट्र! छत्रपती शिवाजी महाराजांचे विचार, गड-किल्ले आणि मराठी अस्मिता आमचा स्वाभिमान आहे. 🚩🦁',
  'मुंबई-पुणे द्रुतगती मार्ग, मेट्रो नेटवर्क आणि समृद्धी महामार्गामुळे राज्याच्या विकासाला मोठा वेग मिळाला आहे. 🛣️🚄',
  'शेतकऱ्यांच्या शेतमालाला योग्य हमीभाव, सिंचन प्रकल्प आणि दुष्काळ निवारण यावर शासनाने विशेष भर द्यावा. 🌾',
  'गणेशोत्सव, आषाढी वारी आणि लावणी संस्कृती ही महाराष्ट्राची जागतिक पातळीवर वेगळी ओळख आहे. 🙏🥁',
  'कायदा व सुव्यवस्था अबाधित राखण्यासाठी पोलिसांची तत्परता आणि कडक कारवाई कौतुकास्पद आहे. ⚖️',
  'विश्वसनीय बातम्या आणि अधिकृत मूळ बातमी लिंक (Source link) दिल्याबद्दल आपला महाराष्ट्र डेस्कचे आभार! 📰',
  'उद्योग, माहिती तंत्रज्ञान आणि पायाभूत सुविधांमध्ये महाराष्ट्र नेहमीच देशात अव्वल राहिला पाहिजे. 💼🌟',
  'पुणे, नाशिक, नागपूर आणि छत्रपती संभाजीनगरमधील शिक्षण व रोजगार संधींचा विस्तार अभिमानास्पद आहे. 📚🏢',
];

function fetchHttps(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaAaplaMaharashtra/1.0 (Windows NT 10.0; Win64; x64)',
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

async function fetchAllMaharashtraArticles(targetCount = 46) {
  console.log('📡 Fetching live Maharashtra Marathi news from Newsdata.io API...');
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
  console.log('   • Calling primary user-specified URL (qInTitle=maharastra & language=mr)...');
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

  // 2. Fetch from qInTitle=maharashtra across pages
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Paginating through qInTitle=maharashtra (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 4; p++) {
        let u = SUPPLEMENTARY_URL_TITLE;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchHttps(u);
        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
            console.log(`     ✅ qInTitle=maharashtra Page ${p} returned ${json.results.length} articles.`);
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

  // 3. Fetch from qInTitle=महाराष्ट्र
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing with qInTitle=महाराष्ट्र (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      const res = await fetchHttps(SUPPLEMENTARY_URL_TITLE_MR);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
          console.log(`     ✅ qInTitle=महाराष्ट्र returned ${json.results.length} articles.`);
          addArticles(json.results);
        }
      }
    } catch (err) {
      // continue
    }
  }

  // 4. Supplement if needed with q=maharashtra
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing coverage with q=maharashtra (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 4; p++) {
        let u = SUPPLEMENTARY_URL_QUERY;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchHttps(u);
        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
            console.log(`     ✅ q=maharashtra Page ${p} returned ${json.results.length} articles.`);
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

  console.log(`✅ Total unique Maharashtra Marathi news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles.slice(0, targetCount);
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatMaharashtraPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #AaplaMaharashtra #Maharashtra #Mumbai #Pune #Nagpur #Nashik #IndiaTrends';
  const prefix = '🚩 MAHARASHTRA: ';
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
  console.log('🚀 SEEDING "VARTA | AAPLA MAHARASHTRA" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllMaharashtraArticles(46);
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

  // 3. Upsert official desk user @aapla_maharashtra
  console.log('👤 Ensuring official desk account "@aapla_maharashtra" exists...');
  let mhUser = await prisma.user.findUnique({
    where: { username: 'aapla_maharashtra' },
    include: { profile: true },
  });

  const mhUserData = {
    email: 'maharashtra@varta.in',
    username: 'aapla_maharashtra',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const mhProfileData = {
    displayName: 'VARTA Aapla Maharashtra 🚩🦁',
    bio: 'Official Maharashtra Desk of VARTA. जय महाराष्ट्र! Real-time updates from Mumbai, Pune, Nagpur, Nashik, Chhatrapati Sambhajinagar, politics, business, agriculture, and Marathi culture. #AaplaMaharashtra',
    avatarUrl:
      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
    location: 'Mumbai / Pune, Maharashtra',
    website: 'https://newsdata.io',
  };

  if (!mhUser) {
    mhUser = await prisma.user.create({
      data: {
        ...mhUserData,
        profile: {
          create: mhProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@aapla_maharashtra" user (ID: ${mhUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: mhUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: mhUser.id },
      update: mhProfileData,
      create: { ...mhProfileData, userId: mhUser.id },
    });
    console.log(`✅ Verified existing "@aapla_maharashtra" user (ID: ${mhUser.id})`);
  }

  // 4. Find or create group "VARTA | Aapla Maharashtra" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Aapla Maharashtra" in "India Trends"...');
  const groupSlug = 'varta-aapla-maharashtra';
  const groupData = {
    name: 'VARTA | Aapla Maharashtra',
    slug: groupSlug,
    description:
      'जय महाराष्ट्र! Maximum City Mumbai, Oxford of the East Pune, Chhatrapati Shivaji Maharaj forts, grand Ganesh Utsav celebrations, Lavani folk beats, Sahyadri monsoon treks, and industrial might.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
    creatorId: mhUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Aapla Maharashtra" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Aapla Maharashtra" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Aapla Maharashtra...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === mhUser.id)) {
    memberCandidates.push(mhUser);
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
        role: m.id === mhUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Aapla Maharashtra now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Maharashtra news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @aapla_maharashtra, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? mhUser : getRandomElement([mhUser, ...memberCandidates]);

    const postContent = formatMaharashtraPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across recent days
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 24 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 130) + 45;
    const repostCount = Math.floor(Math.random() * 40) + 12;
    const bookmarkCount = Math.floor(Math.random() * 30) + 8;

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
      const commentText = getRandomElement(MAHARASHTRA_COMMENTS_MR);

      const commenter =
        getRandomElement(memberCandidates.filter((u) => u.id !== parentPost.authorId)) ||
        rakaUser ||
        users[0];

      const commentDate = new Date(parentPost.createdAt.getTime() + (c + 1) * 14 * 60 * 1000);

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            parentId: parentPost.id,
            groupId: group.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 32) + 5,
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
  console.log('🎉 "VARTA | AAPLA MAHARASHTRA" LIVE FEED SEEDING COMPLETE!');
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

const path = require('path');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const API_KEY = 'pub_f6d491c00a0d49d699d15811ca828e31';

// Exact primary URL requested by the user
const PRIMARY_URL =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=Uttar%20Pradesh&country=in&language=hi&category=breaking,domestic,crime,top,politics';

// Supplementary query URLs with Hindi keywords to ensure full coverage (45+ posts)
const SUPPLEMENTARY_URL_TITLE_HI =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=' +
  encodeURIComponent('उत्तर प्रदेश') +
  '&country=in&language=hi&category=breaking,domestic,crime,top,politics';

const SUPPLEMENTARY_URL_QUERY =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&q=' +
  encodeURIComponent('उत्तर प्रदेश') +
  '&country=in&language=hi&category=breaking,domestic,crime,top,politics';

const UP_COMMENTS = [
  'काशी विश्वनाथ, अयोध्या धाम और प्रयागराज संगम! उत्तर प्रदेश हमारी आस्था और संस्कृति का केंद्र है। 🙏🛕',
  'एक्सप्रेसवे नेटवर्क, जेवर इंटरनेशनल एयरपोर्ट और डिफेंस कॉरिडोर से प्रदेश में निवेश और विकास की नई लहर है। 🛣️✈️',
  'लखनऊ की नजाकत-नफासत, चिकनकारी और अवधी तहज़ीब पूरे देश में बेमिसाल है। 🌟',
  'किसानों के लिए गन्ने के बकाए का भुगतान और आधुनिक मंडियों का विस्तार बहुत सराहनीय है। 🌾',
  'कानून-व्यवस्था और सुरक्षा व्यवस्था में सख्त कदम उठाने से आम नागरिकों का विश्वास बढ़ा है। ⚖️',
  'प्रमाणिक समाचार और मूल स्रोत लिंक उपलब्ध कराने के लिए अपना उत्तर प्रदेश डेस्क का धन्यवाद! 📰',
  'शिक्षा, स्वास्थ्य और स्थानीय हस्तशिल्प (ODOP) को वैश्विक स्तर पर पहचान मिलना गर्व की बात है। 🏺',
  'पूर्वांचल से पश्चिमांचल तक पर्यटन और औद्योगिक गलियारों का तेजी से विस्तार हो रहा है। 🚄',
];

function fetchJson(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaApnaUttarPradesh/1.0 (Windows NT 10.0; Win64; x64)',
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

async function fetchAllUPArticles(targetCount = 48) {
  console.log('📡 Fetching live Uttar Pradesh news from Newsdata.io API...');
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
  console.log('   • Calling primary user-specified URL (qInTitle=Uttar Pradesh & language=hi)...');
  try {
    let nextToken = null;
    for (let p = 1; p <= 3; p++) {
      let u = PRIMARY_URL;
      if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
      const res = await fetchJson(u);
      if (res.results && res.results.length > 0) {
        console.log(`     ✅ Primary URL Page ${p} returned ${res.results.length} articles.`);
        addArticles(res.results);
        nextToken = res.nextPage;
        if (!nextToken || uniqueArticles.length >= targetCount) break;
      } else {
        break;
      }
    }
  } catch (e) {
    console.warn('     ⚠️ Primary URL fetch notice:', e.message);
  }

  // 2. Fetch from qInTitle=उत्तर प्रदेश (Hindi headline exact match)
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing with qInTitle=उत्तर प्रदेश (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 4; p++) {
        let u = SUPPLEMENTARY_URL_TITLE_HI;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchJson(u);
        if (res.results && res.results.length > 0) {
          console.log(`     ✅ qInTitle=उत्तर प्रदेश Page ${p} returned ${res.results.length} articles.`);
          addArticles(res.results);
          nextToken = res.nextPage;
          if (!nextToken || uniqueArticles.length >= targetCount) break;
        } else {
          break;
        }
      }
    } catch (err) {
      // continue
    }
  }

  // 3. Supplement if needed with q=उत्तर प्रदेश to safely reach targetCount
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing with q=उत्तर प्रदेश (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 3; p++) {
        let u = SUPPLEMENTARY_URL_QUERY;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchJson(u);
        if (res.results && res.results.length > 0) {
          console.log(`     ✅ q=उत्तर प्रदेश Page ${p} returned ${res.results.length} articles.`);
          addArticles(res.results);
          nextToken = res.nextPage;
          if (!nextToken || uniqueArticles.length >= targetCount) break;
        } else {
          break;
        }
      }
    } catch (err) {
      // continue
    }
  }

  console.log(`✅ Total unique Uttar Pradesh news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatUPPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #ApnaUttarPradesh #UttarPradesh #Lucknow #Ayodhya #Varanasi #UPNews #IndiaTrends';
  const prefix = '🏛️ UTTAR PRADESH: ';
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
  console.log('🚀 SEEDING "VARTA | APNA UTTAR PRADESH" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllUPArticles(48);
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

  // 3. Upsert official desk user @apna_up
  console.log('👤 Ensuring official desk account "@apna_up" exists...');
  let upUser = await prisma.user.findUnique({
    where: { username: 'apna_up' },
    include: { profile: true },
  });

  const upUserData = {
    email: 'up@varta.in',
    username: 'apna_up',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const upProfileData = {
    displayName: 'VARTA Apna Uttar Pradesh 🏛️',
    bio: 'Official Uttar Pradesh Desk of VARTA. सांस्कृतिक एवं आध्यात्मिक हृदय! Real-time coverage across Lucknow, Varanasi, Ayodhya, Prayagraj, Kanpur, Agra, governance, expressways, and UP culture. #ApnaUttarPradesh',
    avatarUrl:
      'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&fit=crop&q=80',
    location: 'Lucknow, Uttar Pradesh',
    website: 'https://newsdata.io',
  };

  if (!upUser) {
    upUser = await prisma.user.create({
      data: {
        ...upUserData,
        profile: {
          create: upProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@apna_up" user (ID: ${upUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: upUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: upUser.id },
      update: upProfileData,
      create: { ...upProfileData, userId: upUser.id },
    });
    console.log(`✅ Verified existing "@apna_up" user (ID: ${upUser.id})`);
  }

  // 4. Find or create group "VARTA | Apna Uttar Pradesh" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Apna Uttar Pradesh" in "India Trends"...');
  const groupSlug = 'varta-apna-uttar-pradesh';
  const groupData = {
    name: 'VARTA | Apna Uttar Pradesh',
    slug: groupSlug,
    description:
      'The cultural & spiritual heartbeat of Bharat! Sacred Kashi ghats, Ayodhya Ram Mandir, Lucknow Nawabi tehzeeb & Chikankari embroidery, Agra Taj Mahal, and industrial expressway corridors.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&fit=crop&q=80',
    creatorId: upUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Apna Uttar Pradesh" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Apna Uttar Pradesh" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Apna Uttar Pradesh...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === upUser.id)) {
    memberCandidates.push(upUser);
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
        role: m.id === upUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Apna Uttar Pradesh now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Uttar Pradesh news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @apna_up, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? upUser : getRandomElement([upUser, ...memberCandidates]);

    const postContent = formatUPPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across recent days
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 22 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 125) + 45;
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
    // Attach 1 to 2 comments on most posts
    const numComments = Math.random() < 0.85 ? (Math.random() < 0.4 ? 2 : 1) : 0;

    for (let c = 0; c < numComments; c++) {
      const commentText = getRandomElement(UP_COMMENTS);

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
  console.log('🎉 "VARTA | APNA UTTAR PRADESH" LIVE FEED SEEDING COMPLETE!');
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

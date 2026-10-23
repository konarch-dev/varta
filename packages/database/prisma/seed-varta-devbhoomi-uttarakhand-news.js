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
  '&qInTitle=Uttarakhand&country=in&language=hi&category=breaking,domestic,crime,top,politics';

// Supplementary query URLs with Hindi keywords
const SUPPLEMENTARY_URL_TITLE_HI =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=' +
  encodeURIComponent('उत्तराखंड') +
  '&country=in&language=hi&category=breaking,domestic,crime,top,politics';

const SUPPLEMENTARY_URL_QUERY =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&q=uttarakhand&country=in&language=hi&category=breaking,domestic,crime,top,politics';

const UTTARAKHAND_COMMENTS_HI = [
  'जय बद्री-विशाल! हर हर केदार! देवभूमि उत्तराखंड की पावन धरा, चारधाम और गंगा-यमुना का उद्गम हमारा गौरव है। 🏔️🛕',
  'ऋषिकेश-कर्णप्रयाग रेल लाइन और ऑल-वेदर रोड परियोजना से पर्वतीय अंचलों में कनेक्टिविटी बहुत मजबूत हुई है। 🚄🛣️',
  'युवाओं के लिए रोजगार, भर्ती परीक्षाओं में पारदर्शिता और कड़े नकल विरोधी कानून का निर्णय सराहनीय है। 📚',
  'फूलों की घाटी (Valley of Flowers), औली और जिम कॉर्बेट में पर्यावरण संरक्षण के साथ सतत पर्यटन को बढ़ावा मिलना चाहिए। 🌿',
  'कानून-व्यवस्था और आपदा प्रबंधन में राज्य सरकार एवं एसडीआरएफ की तत्परता जनहित में प्रशंसनीय है। ⚖️',
  'प्रमाणिक समाचार और मूल स्रोत लिंक उपलब्ध कराने के लिए देवभूमि उत्तराखंड डेस्क का धन्यवाद! 📰',
  'गढ़वाली और कुमाऊंनी लोक संस्कृति, ऐपण कला और पारंपरिक लोकगीत हमारी आत्मा हैं। 🪘🌸',
  'हर्बल कृषि, सेब बागवानी और स्थानीय होमस्टे से पहाड़ों में आजीविका के नए रास्ते खुल रहे हैं। 🍎🏡',
];

function fetchHttps(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaDevbhoomiUttarakhand/1.0 (Windows NT 10.0; Win64; x64)',
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

async function fetchAllUttarakhandArticles(targetCount = 46) {
  console.log('📡 Fetching live Uttarakhand Hindi news from Newsdata.io API...');
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

  // 1. Fetch from exact user-requested primary URL across pages
  console.log('   • Calling primary user-specified URL (qInTitle=Uttarakhand & language=hi)...');
  try {
    let nextToken = null;
    for (let p = 1; p <= 3; p++) {
      let u = PRIMARY_URL;
      if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
      const res = await fetchHttps(u);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
          console.log(`     ✅ Primary URL Page ${p} returned ${json.results.length} articles.`);
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
  } catch (e) {
    console.warn('     ⚠️ Primary URL fetch notice:', e.message);
  }

  // 2. Supplement with qInTitle=उत्तराखंड to reach targetCount
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing coverage with qInTitle=उत्तराखंड (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 5; p++) {
        let u = SUPPLEMENTARY_URL_TITLE_HI;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchHttps(u);
        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
            console.log(`     ✅ qInTitle=उत्तराखंड Page ${p} returned ${json.results.length} articles.`);
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

  // 3. Supplement if needed with q=uttarakhand
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing coverage with q=uttarakhand (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 3; p++) {
        let u = SUPPLEMENTARY_URL_QUERY;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchHttps(u);
        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
            console.log(`     ✅ q=uttarakhand Page ${p} returned ${json.results.length} articles.`);
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

  console.log(`✅ Total unique Uttarakhand news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles.slice(0, targetCount);
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatUttarakhandPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #DevbhoomiUttarakhand #Uttarakhand #Dehradun #CharDham #Rishikesh #Haridwar #IndiaTrends';
  const prefix = '🏔️ UTTARAKHAND: ';
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
  console.log('🚀 SEEDING "VARTA | DEVBHOOMI UTTARAKHAND" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllUttarakhandArticles(46);
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

  // 3. Upsert official desk user @devbhoomi_uttarakhand
  console.log('👤 Ensuring official desk account "@devbhoomi_uttarakhand" exists...');
  let ukUser = await prisma.user.findUnique({
    where: { username: 'devbhoomi_uttarakhand' },
    include: { profile: true },
  });

  const ukUserData = {
    email: 'uttarakhand@varta.in',
    username: 'devbhoomi_uttarakhand',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const ukProfileData = {
    displayName: 'VARTA Devbhoomi Uttarakhand 🏔️🛕',
    bio: 'Official Uttarakhand Desk of VARTA. देवभूमि! Real-time updates from Dehradun, Haridwar, Rishikesh, Char Dham yatra, Kedarnath, Badrinath, education, and hill state governance. #DevbhoomiUttarakhand',
    avatarUrl:
      'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    location: 'Dehradun, Uttarakhand',
    website: 'https://newsdata.io',
  };

  if (!ukUser) {
    ukUser = await prisma.user.create({
      data: {
        ...ukUserData,
        profile: {
          create: ukProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@devbhoomi_uttarakhand" user (ID: ${ukUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: ukUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: ukUser.id },
      update: ukProfileData,
      create: { ...ukProfileData, userId: ukUser.id },
    });
    console.log(`✅ Verified existing "@devbhoomi_uttarakhand" user (ID: ${ukUser.id})`);
  }

  // 4. Find or create group "VARTA | Devbhoomi Uttarakhand" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Devbhoomi Uttarakhand" in "India Trends"...');
  const groupSlug = 'varta-devbhoomi-uttarakhand';
  const groupData = {
    name: 'VARTA | Devbhoomi Uttarakhand',
    slug: groupSlug,
    description:
      'Simply Heaven! Sacred Char Dham (Kedarnath, Badrinath, Gangotri, Yamunotri), Yoga Capital Rishikesh, Valley of Flowers, Jim Corbett tiger reserve, and pristine Garhwali & Kumaoni culture.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    creatorId: ukUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Devbhoomi Uttarakhand" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Devbhoomi Uttarakhand" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Devbhoomi Uttarakhand...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === ukUser.id)) {
    memberCandidates.push(ukUser);
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
        role: m.id === ukUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Devbhoomi Uttarakhand now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Uttarakhand news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @devbhoomi_uttarakhand, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? ukUser : getRandomElement([ukUser, ...memberCandidates]);

    const postContent = formatUttarakhandPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across recent days
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 26 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 120) + 40;
    const repostCount = Math.floor(Math.random() * 35) + 10;
    const bookmarkCount = Math.floor(Math.random() * 25) + 6;

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
      const commentText = getRandomElement(UTTARAKHAND_COMMENTS_HI);

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
            likeCount: Math.floor(Math.random() * 28) + 4,
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
  console.log('🎉 "VARTA | DEVBHOOMI UTTARAKHAND" LIVE FEED SEEDING COMPLETE!');
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

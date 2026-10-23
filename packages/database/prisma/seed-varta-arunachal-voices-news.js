const path = require('path');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const API_KEY = 'pub_f6d491c00a0d49d699d15811ca828e31';

// Primary requested URL
const PRIMARY_URL =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=' +
  encodeURIComponent('arunachal pradesh') +
  '&country=in&language=hi,en&category=breaking,domestic,crime,top,politics';

// Supplementary endpoints to guarantee rich live news coverage if exact title match cache is empty
const SUPPLEMENTARY_URLS = [
  'https://newsdata.io/api/1/latest?apikey=' + API_KEY + '&qInTitle=arunachal&country=in&language=hi,en',
  'https://newsdata.io/api/1/latest?apikey=' + API_KEY + '&q=' + encodeURIComponent('arunachal pradesh') + '&country=in&language=hi,en&category=breaking,domestic,crime,top,politics',
  'https://newsdata.io/api/1/latest?apikey=' + API_KEY + '&q=' + encodeURIComponent('arunachal pradesh') + '&country=in&language=hi,en',
  'https://newsdata.io/api/1/latest?apikey=' + API_KEY + '&q=itanagar&country=in&language=hi,en',
  'https://newsdata.io/api/1/latest?apikey=' + API_KEY + '&q=tawang&country=in&language=hi,en',
];

const ARUNACHAL_COMMENTS_EN = [
  'Critical update from Arunachal Pradesh. Crucial for frontier development and security 📰',
  'Eco-tourism, sustainable hydel projects, and tribal heritage balance is key for Arunachal.',
  'Thanks to VARTA Arunachal Voices for verified reporting and source link!',
  'Tawang, Siang, and Mechukha connectivity has improved remarkably.',
  'Appreciate the swift coverage from Itanagar and the border districts.',
  'Indigenous traditions and environmental conservation must always go hand in hand. 🌿',
];

const ARUNACHAL_COMMENTS_HI = [
  'अरुणाचल प्रदेश के विकास और सीमावर्ती सुरक्षा से जुड़ी बहुत महत्वपूर्ण खबर। 🏔️',
  'तवांग और ईटानगर की ज़मीनी रिपोर्टिंग और ताज़ा अपडेट्स के लिए धन्यवाद।',
  'पूर्वोत्तर भारत की प्राकृतिक सुंदरता और जनजातीय संस्कृति का संरक्षण बहुत जरूरी है। 🌿',
  'प्रमाणिक समाचार और स्रोत लिंक साझा करने के लिए आभार!',
  'सड़क संपर्क और सीमावर्ती बुनियादी ढांचे में निरंतर सुधार हो रहा है।',
  'अरुणाचल के युवाओं और स्थानीय समुदायों के लिए नए अवसर खुल रहे हैं। 🌟',
];

function fetchJson(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaArunachalVoices/1.0 (Windows NT 10.0; Win64; x64)',
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

async function fetchAllArunachalArticles(targetCount = 40) {
  console.log('📡 Fetching live Arunachal Pradesh news from Newsdata.io API...');
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

  // 1. First fetch from exact user-requested primary URL
  console.log('   • Calling primary user-specified URL...');
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
        if (!nextToken) break;
      } else {
        console.log('     ℹ️ Primary URL returned 0 articles (no exact string in title cache).');
        break;
      }
    }
  } catch (e) {
    console.warn('     ⚠️ Primary URL error:', e.message);
  }

  // 2. Supplement if needed with related Arunachal Pradesh queries
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing coverage (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    for (const suppUrl of SUPPLEMENTARY_URLS) {
      if (uniqueArticles.length >= targetCount) break;
      try {
        let nextToken = null;
        for (let p = 1; p <= 3; p++) {
          let u = suppUrl;
          if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
          const res = await fetchJson(u);
          if (res.results && res.results.length > 0) {
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
  }

  console.log(`✅ Total unique Arunachal news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatArunachalPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #ArunachalVoices #ArunachalPradesh #Tawang #Itanagar #NorthEast #IndiaTrends';
  const prefix = '🏔️ ARUNACHAL: ';
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
  console.log('🚀 SEEDING "VARTA | ARUNACHAL VOICES" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllArunachalArticles(45);
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

  // 3. Upsert official desk user @arunachal_voices
  console.log('👤 Ensuring official desk account "@arunachal_voices" exists...');
  let arunachalUser = await prisma.user.findUnique({
    where: { username: 'arunachal_voices' },
    include: { profile: true },
  });

  const arunachalUserData = {
    email: 'arunachal@varta.in',
    username: 'arunachal_voices',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const arunachalProfileData = {
    displayName: 'VARTA Arunachal Voices 🏔️',
    bio: 'Official Arunachal Pradesh Desk of VARTA. Land of the Dawn-Lit Mountains. Frontier development, Tawang, Itanagar, tribal culture, biodiversity, and real-time news updates across Arunachal. #ArunachalVoices',
    avatarUrl:
      'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    location: 'Itanagar / Tawang, Arunachal Pradesh',
    website: 'https://newsdata.io',
  };

  if (!arunachalUser) {
    arunachalUser = await prisma.user.create({
      data: {
        ...arunachalUserData,
        profile: {
          create: arunachalProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@arunachal_voices" user (ID: ${arunachalUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: arunachalUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: arunachalUser.id },
      update: arunachalProfileData,
      create: { ...arunachalProfileData, userId: arunachalUser.id },
    });
    console.log(`✅ Verified existing "@arunachal_voices" user (ID: ${arunachalUser.id})`);
  }

  // 4. Find or create group "VARTA | Arunachal Voices" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Arunachal Voices" in "India Trends"...');
  const groupSlug = 'varta-arunachal-voices';
  const groupData = {
    name: 'VARTA | Arunachal Voices',
    slug: groupSlug,
    description:
      'Land of the Dawn-Lit Mountains! Connecting Arunachal Pradesh across 26 major indigenous tribes, Tawang Monastery, scenic Ziro Valley, biodiversity hotspots, and Eastern frontier development.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    creatorId: arunachalUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Arunachal Voices" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Arunachal Voices" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Arunachal Voices...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === arunachalUser.id)) {
    memberCandidates.push(arunachalUser);
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
        role: m.id === arunachalUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Arunachal Voices now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Arunachal Pradesh news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @arunachal_voices, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? arunachalUser : getRandomElement([arunachalUser, ...memberCandidates]);

    const postContent = formatArunachalPostContent(
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
      const isHindi = Math.random() < 0.5;
      const commentPool = isHindi ? ARUNACHAL_COMMENTS_HI : ARUNACHAL_COMMENTS_EN;
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
  console.log('🎉 "VARTA | ARUNACHAL VOICES" LIVE FEED SEEDING COMPLETE!');
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

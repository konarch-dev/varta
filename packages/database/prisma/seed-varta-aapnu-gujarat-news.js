const path = require('path');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const NEWSDATA_GUJARAT_URL =
  'https://newsdata.io/api/1/latest?apikey=pub_f6d491c00a0d49d699d15811ca828e31&qInTitle=gujarat&country=in&language=gu,en&category=breaking,domestic,crime,top,politics';

const GUJARAT_COMMENTS_EN = [
  'Critical update from Gujarat. Thanks for keeping the community informed in real-time 📰',
  'Gir Asiatic lion conservation and railway corridor safety need urgent attention 🦁',
  'GIFT City and industrial modernization are propelling Gujarat to new economic heights!',
  'Appreciate VARTA Aapnu Gujarat for verified reporting and direct article links.',
  'Law and order, educational safety, and student welfare must always come first. ⚖️',
  'Civic infrastructure and public transparency across all districts should remain a priority. 🌟',
];

const GUJARAT_COMMENTS_GU = [
  'જય જય ગરવી ગુજરાત! ગુજરાતના તાજા અને મહત્વના સમાચાર માટે આભાર 🦁',
  'રાજ્યમાં વહીવટી પારદર્શિતા અને લોકોની સુરક્ષા સૌથી મહત્વપૂર્ણ છે.',
  'અમરેલી અને ગીરના સિંહોના સંરક્ષણ માટે વન વિભાગે સતર્ક રહેવું જોઈએ 🌿',
  'સત્તાવાર સમાચાર અને સોર્સ લિંક આપવા બદલ આપણું ગુજરાતનો આભાર!',
  'ગિફ્ટ સિટી અને રાજ્યનો આર્થિક વિકાસ નવી ઊંચાઈઓ આંબી રહ્યો છે. 🚀',
  'શિક્ષણ અને યુવા કૌશલ્ય વિકાસ પર વિશેષ ધ્યાન આપવું જરૂરી છે. 🌟',
];

function fetchJson(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaAapnuGujarat/1.0 (Windows NT 10.0; Win64; x64)',
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

async function fetchAllGujaratArticles(maxPages = 6) {
  console.log(`📡 Fetching live Gujarat news from Newsdata.io API (up to ${maxPages} pages)...`);
  const articles = [];
  let nextPageToken = null;

  for (let page = 1; page <= maxPages; page++) {
    let url = NEWSDATA_GUJARAT_URL;
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

  console.log(`✅ Total unique Gujarat news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatGujaratPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #AapnuGujarat #Gujarat #GujaratNews #Ahmedabad #GIFTCity #IndiaTrends';
  const prefix = '🦁 GUJARAT: ';
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
  console.log('🚀 SEEDING "VARTA | AAPNU GUJARAT" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllGujaratArticles(6);
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

  // 3. Upsert official desk user @aapnu_gujarat
  console.log('👤 Ensuring official desk account "@aapnu_gujarat" exists...');
  let gujaratUser = await prisma.user.findUnique({
    where: { username: 'aapnu_gujarat' },
    include: { profile: true },
  });

  const gujaratUserData = {
    email: 'gujarat@varta.in',
    username: 'aapnu_gujarat',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const gujaratProfileData = {
    displayName: 'VARTA Aapnu Gujarat 🦁',
    bio: 'Official Gujarat News & Culture desk of VARTA. Jay Jay Garvi Gujarat! Real-time updates, GIFT City, Ahmedabad, Surat, Gir lions, politics, industry & Gujarati pride. #AapnuGujarat',
    avatarUrl:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&auto=format&fit=crop&q=80',
    location: 'Ahmedabad / Gandhinagar, Gujarat',
    website: 'https://newsdata.io',
  };

  if (!gujaratUser) {
    gujaratUser = await prisma.user.create({
      data: {
        ...gujaratUserData,
        profile: {
          create: gujaratProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@aapnu_gujarat" user (ID: ${gujaratUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: gujaratUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: gujaratUser.id },
      update: gujaratProfileData,
      create: { ...gujaratProfileData, userId: gujaratUser.id },
    });
    console.log(`✅ Verified existing "@aapnu_gujarat" user (ID: ${gujaratUser.id})`);
  }

  // 4. Find or create group "VARTA | Aapnu Gujarat" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Aapnu Gujarat" in "India Trends"...');
  const groupSlug = 'varta-aapnu-gujarat';
  const groupData = {
    name: 'VARTA | Aapnu Gujarat',
    slug: groupSlug,
    description:
      'જય જય ગરવી ગુજરાત! Vibrant entrepreneurship, GIFT City international finance hub, Statue of Unity, 9 nights of Navratri Garba, Rann of Kutch white desert, and iconic Gujarati cuisine.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&auto=format&fit=crop&q=80',
    creatorId: gujaratUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Aapnu Gujarat" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Aapnu Gujarat" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Aapnu Gujarat...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === gujaratUser.id)) {
    memberCandidates.push(gujaratUser);
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
        role: m.id === gujaratUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Aapnu Gujarat now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Gujarat news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @aapnu_gujarat, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? gujaratUser : getRandomElement([gujaratUser, ...memberCandidates]);

    const postContent = formatGujaratPostContent(
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
      const isGujarati = Math.random() < 0.5;
      const commentPool = isGujarati ? GUJARAT_COMMENTS_GU : GUJARAT_COMMENTS_EN;
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
  console.log('🎉 "VARTA | AAPNU GUJARAT" LIVE FEED SEEDING COMPLETE!');
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

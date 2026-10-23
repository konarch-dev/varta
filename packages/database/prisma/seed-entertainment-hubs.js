const path = require('path');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const API_KEY = 'ea52290257e54a14a5b9afd0c7889da1';

const ENTERTAINMENT_VIDEOS = [
  {
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 15400000,
    width: 1280,
    height: 720,
  },
  {
    url: 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4200000,
    width: 960,
    height: 540,
  },
  {
    url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4800000,
    width: 720,
    height: 480,
  },
];

const HUB_CONFIGS = [
  {
    id: 'bollywood',
    name: 'Vantara Bollywood Masala',
    slug: 'vantara-bollywood-masala',
    description:
      "The hottest Bollywood gossip, box office records, blockbuster releases, red carpet glam, and star-studded drama right from Mumbai's film city!",
    avatarUrl:
      'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
    hashtags: ' #Bollywood #VantaraBollywood #Masala #BoxOffice #Cinema #Entertainment',
    urls: [
      `https://newsapi.org/v2/everything?q=bollywood&apiKey=${API_KEY}`,
    ],
    discussions: [
      'The box office collections on day one are mind-boggling! Pure stardom power 🎬🔥',
      'That musical soundtrack has been on repeat all week. Classic Bollywood magic!',
      'The trailer cut is intense! Can not wait for the first-day-first-show release 🍿',
      'The red carpet fashion at the awards show was dazzling. Unmatched elegance!',
      'Direction and cinematography in this new release took everyone by surprise. Superb craft!',
      'Thanks for sharing the news article and source link! Keeping track of Bollywood updates here 📰✨',
    ],
  },
  {
    id: 'hollywood',
    name: 'Vantara Hollywood Vibe',
    slug: 'vantara-hollywood-vibe',
    description:
      'Your VIP pass to Hollywood! Oscars, blockbuster premieres, Marvel & DC updates, celebrity interviews, and backstage Hollywood scoops.',
    avatarUrl:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    hashtags: ' #Hollywood #VantaraHollywood #Oscars #Cinema #Blockbuster #Entertainment',
    urls: [
      `https://newsapi.org/v2/everything?q=hollywood&apiKey=${API_KEY}`,
    ],
    discussions: [
      'A true cinematic triumph! The IMAX camera sequences were absolutely breathtaking 🎥🍿',
      'Oscar nomination buzz is definitely building up for this lead performance!',
      'The plot twists kept me glued to the edge of my seat throughout the third act.',
      'Superb practical effects over CGI—filmmaking at its very best 🌟',
      'Thanks for the original news source link! Hollywood season is heating up 📰🎬',
    ],
  },
  {
    id: 'gujarati',
    name: 'Vantara Gujarati Cinema',
    slug: 'vantara-gujarati-cinema',
    description:
      'Celebrating the golden new wave of Dhollywood & Gujarati Cinema! National award-winning films, urban Gujarati storytelling, box office hits, and theater stalwarts.',
    avatarUrl:
      'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&auto=format&fit=crop&q=80',
    hashtags: ' #GujaratiCinema #Dhollywood #VantaraGujarati #GujaratiFilms #Entertainment',
    urls: [
      `https://newsapi.org/v2/everything?q=gujarati%20cinema&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=dhollywood&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=gujarati%20film&apiKey=${API_KEY}`,
    ],
    discussions: [
      'Gujarati cinema has reached such immense heights! The storytelling depth is beautiful 🎭👏',
      'Proud to see regional cinema receiving national acclaim and international festival screenings!',
      'The music and folk roots woven into this film gave pure goosebumps.',
      'Incredible performance by the theater veteran actors. Pure raw emotion!',
      'Great coverage! Thanks for highlighting Gujarati cinema stories on Vantara 📰✨',
    ],
  },
  {
    id: 'southcinema',
    name: 'Vantara South Indian Cinema Gossip',
    slug: 'vantara-south-indian-cinema-gossip',
    description:
      'The electrifying hub for Tollywood, Kollywood, Mollywood, and Sandalwood! Pan-Indian mega blockbusters, first-look teasers, star gossip, and record-shattering box office updates.',
    avatarUrl:
      'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80',
    hashtags: ' #SouthCinema #Tollywood #Kollywood #Mollywood #Sandalwood #PanIndia #Entertainment',
    urls: [
      `https://newsapi.org/v2/everything?q=Tollywood&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=Kollywood&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=Mollywood&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=Sandalwood&apiKey=${API_KEY}`,
    ],
    discussions: [
      'The mass elevation scene in the interval block made the entire theater erupt! Absolute goosebumps 🔥⚡',
      'Mollywood scriptwriting standards are unmatched. Realistic yet so gripping!',
      'Anirudh / AR Rahman background score elevated every single high-octane scene.',
      'The pan-Indian box office wave shows the sheer hunger for high-scale spectacle cinema 🏆🎬',
      'The teaser drop broke all 24-hour YouTube view records! What sheer stardom 🌟',
    ],
  },
  {
    id: 'kdrama',
    name: 'Vantara K-Drama Scene',
    slug: 'vantara-k-drama-scene',
    description:
      'The ultimate destination for Hallyu & K-Drama lovers! Streaming chart-toppers, romance & thriller breakdowns, Korean celebrity gossip, and upcoming drama trailers.',
    avatarUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80',
    hashtags: ' #KDrama #Hallyu #KoreanDrama #VantaraKDrama #Hallyuwood #Entertainment',
    urls: [
      `https://newsapi.org/v2/everything?q=Hallyuwood&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=k-drama&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=Hallyu&apiKey=${API_KEY}`,
    ],
    discussions: [
      'The chemistry between the two leads is off the charts! Best episode of the series so far 💖✨',
      'That cliffhanger ending left me in complete shock! Next weekend can not come soon enough.',
      'The original soundtrack (OST) on this drama has been stuck in my head all day 🎶',
      'Second lead syndrome is hitting so hard right now. Why do they do this to our hearts?! 😭',
      'K-Drama cinematography and color grading is just so aesthetically pleasing and warm.',
    ],
  },
  {
    id: 'anime',
    name: 'Vantara Anime',
    slug: 'vantara-anime',
    description:
      'From shonen battles to slice-of-life masterpieces! Anime seasonal releases, manga chapter drops, studio animation breakdowns, and Otaku community discussions.',
    avatarUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
    hashtags: ' #Anime #Manga #VantaraAnime #Otaku #Shonen #Entertainment',
    urls: [
      `https://newsapi.org/v2/everything?q=anime&apiKey=${API_KEY}`,
    ],
    discussions: [
      'The animation fluidness during that fight scene was god-tier! Studio outdid themselves ⚔️🔥',
      'Manga readers knew this twist was coming, but seeing it fully animated gave chills!',
      'Opening theme song of the season right here. The bassline and visuals are perfection 🎸✨',
      'Character development across these last few episodes has been top tier storytelling.',
      'Thanks for sharing the news article! Keeping track of all anime adaptation news here 📰⚡',
    ],
  },
  {
    id: 'japanesecinema',
    name: 'Vantara Japanese Cinema',
    slug: 'vantara-japanese-cinema',
    description:
      'Exploring the legacy and contemporary genius of Japanese Cinema. From Akira Kurosawa classics to modern festival winners, Cannes nominees, and indie arthouse gems.',
    avatarUrl:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    hashtags: ' #JapaneseCinema #JFilm #TokyoCinema #Kurosawa #Cannes #Entertainment',
    urls: [
      `https://newsapi.org/v2/everything?q=Japanese%20Cinema&apiKey=${API_KEY}`,
    ],
    discussions: [
      'The stillness and contemplative pacing of Japanese cinema creates such poignant emotional resonance 🌸📽️',
      'Kore-eda masterfully dissects human relationships with such gentleness and honesty.',
      'The visual composition in every single frame looks like a fine art print.',
      'A true masterclass in screenwriting and subtle emotional performances 🏆✨',
      'Thrilled to see Japanese arthouse cinema celebrated on Vantara! Great article 📰',
    ],
  },
  {
    id: 'europeancinema',
    name: 'Vantara European Cinema',
    slug: 'vantara-european-cinema',
    description:
      "The refined home of European Art Cinema, French New Wave, Italian Neorealism, German Expressionism, and Spanish masterpieces. Festival Palme d'Or winners and auteur visionaries.",
    avatarUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=1200&auto=format&fit=crop&q=80',
    hashtags: ' #EuropeanCinema #FrenchCinema #ItalianCinema #GermanCinema #SpanishCinema #Entertainment',
    urls: [
      `https://newsapi.org/v2/everything?q=European%20Art%20Cinema&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=French%20Cinema&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=Italian%20Cinema&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=German%20Cinema&apiKey=${API_KEY}`,
      `https://newsapi.org/v2/everything?q=Spanish%20Cinema&apiKey=${API_KEY}`,
    ],
    discussions: [
      'The poetic realism and philosophical depth in European cinema will always remain unmatched 🏛️🎬',
      'Deserved every bit of praise at Cannes and Venice. Bold auteur filmmaking!',
      'The natural lighting and location shooting brought extraordinary authenticity to the story.',
      'Cinema that challenges your worldview and stays with you long after the credits roll 🌟',
      'Fantastic curation of continental cinema news! Thanks for the source link 📰✨',
    ],
  },
];

function fetchNewsApi(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { 'User-Agent': 'VantaraEntertainment/1.0' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (err) {
            resolve({ status: 'error', message: err.message, articles: [] });
          }
        });
      })
      .on('error', (err) => resolve({ status: 'error', message: err.message, articles: [] }));
  });
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatPostContent(title, description, sourceName, sourceUrl, hashtags) {
  const sourcePart = sourceUrl ? `\n\nSource: ${sourceUrl}` : '';
  const attribution = sourceName ? ` [via ${sourceName}]` : '';

  // Max length is 500 characters in PostgreSQL schema
  const MAX_CONTENT_LENGTH = 490;

  let text = `${title}${attribution}`;
  if (description && description.trim()) {
    text += `\n\n${description.trim()}`;
  }

  const combined = `${text}${sourcePart}${hashtags}`;
  if (combined.length <= MAX_CONTENT_LENGTH) {
    return combined;
  }

  const availableLength =
    MAX_CONTENT_LENGTH - sourcePart.length - hashtags.length - attribution.length - 10;
  let truncatedText = title;
  if (description && description.trim()) {
    const remainingForDesc = availableLength - title.length - 4;
    if (remainingForDesc > 40) {
      truncatedText = `${title}\n\n${description.slice(0, remainingForDesc).trim()}...`;
    }
  } else if (title.length > availableLength) {
    truncatedText = `${title.slice(0, availableLength - 3).trim()}...`;
  }

  return `${truncatedText}${attribution}${sourcePart}${hashtags}`.slice(
    0,
    MAX_CONTENT_LENGTH
  );
}

async function seedHub(config, users, adminUser, rakaUser) {
  console.log(`\n======================================================`);
  console.log(`🎬 Processing: ${config.name} (${config.slug})`);
  console.log(`======================================================`);

  // 1. Fetch articles from all configured URLs
  console.log(`📡 Fetching articles across ${config.urls.length} endpoint(s)...`);
  const allArticles = [];
  const seenTitles = new Set();

  for (const url of config.urls) {
    const res = await fetchNewsApi(url);
    if (res && res.status === 'ok' && Array.isArray(res.articles)) {
      for (const art of res.articles) {
        if (
          art.title &&
          art.title !== '[Removed]' &&
          art.title.trim().length > 5 &&
          !seenTitles.has(art.title.trim().toLowerCase())
        ) {
          seenTitles.add(art.title.trim().toLowerCase());
          allArticles.push(art);
        }
      }
    }
  }

  console.log(`✅ Retrieved ${allArticles.length} unique articles from NewsAPI.`);

  // 2. Upsert group
  let group = await prisma.group.findUnique({
    where: { slug: config.slug },
  });

  const groupData = {
    name: config.name,
    slug: config.slug,
    description: config.description,
    category: 'Entertainment',
    avatarUrl: config.avatarUrl,
    coverUrl: config.coverUrl,
    creatorId: adminUser.id,
    isPrivate: false,
  };

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created Group: "${group.name}" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated Group: "${group.name}" (ID: ${group.id})`);
  }

  // 3. Enroll members
  const memberCandidates = getRandomSubarray(users, Math.min(54, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === adminUser.id)) {
    memberCandidates.push(adminUser);
  }

  for (const u of memberCandidates) {
    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: u.id,
        },
      },
      update: {},
      create: {
        groupId: group.id,
        userId: u.id,
        role: u.id === adminUser.id ? 'ADMIN' : Math.random() < 0.15 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const totalMembers = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`👥 Members enrolled: ${totalMembers}`);

  // 4. Clean prior posts of this group
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 5. Create Posts from NewsAPI
  const maxPostsToCreate = Math.min(allArticles.length, 100);
  console.log(`📝 Seeding ${maxPostsToCreate} posts with media & video highlights...`);

  const createdPosts = [];
  let imagePostCount = 0;
  let videoPostCount = 0;

  for (let idx = 0; idx < maxPostsToCreate; idx++) {
    const article = allArticles[idx];
    const author = getRandomElement(memberCandidates);

    const postContent = formatPostContent(
      article.title,
      article.description,
      article.source?.name,
      article.url,
      config.hashtags
    );

    let postDate = article.publishedAt ? new Date(article.publishedAt) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 3600000);
    }

    const likeCount = Math.floor(Math.random() * 85) + 15;
    const repostCount = Math.floor(Math.random() * 24) + 3;
    const bookmarkCount = Math.floor(Math.random() * 12) + 1;

    const mediaToCreate = [];

    // Attach high-res article image if present
    if (article.urlToImage && article.urlToImage.startsWith('http')) {
      mediaToCreate.push({
        type: 'IMAGE',
        url: article.urlToImage,
        thumbnailUrl: article.urlToImage,
        mimeType: 'image/jpeg',
        sizeBytes: 1350000,
        width: 1200,
        height: 800,
        order: 0,
        createdAt: postDate,
      });
      imagePostCount++;
    }

    // Attach video highlights on select posts (~15% of posts)
    if (idx % 6 === 0) {
      const video = getRandomElement(ENTERTAINMENT_VIDEOS);
      mediaToCreate.push({
        type: 'VIDEO',
        url: video.url,
        thumbnailUrl: article.urlToImage || video.thumbnailUrl,
        mimeType: video.mimeType,
        sizeBytes: video.sizeBytes,
        width: video.width,
        height: video.height,
        order: mediaToCreate.length,
        createdAt: postDate,
      });
      videoPostCount++;
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
      console.error(`Error creating post:`, err.message);
    }
  }

  // 6. Threaded Discussions
  console.log('💬 Seeding member discussion comments...');
  let totalComments = 0;

  for (let i = 0; i < Math.min(createdPosts.length, 30); i++) {
    const parentPost = createdPosts[i];
    const commentsCount = Math.floor(Math.random() * 5) + 1;
    const commenters = getRandomSubarray(
      memberCandidates.filter((u) => u.id !== parentPost.authorId),
      commentsCount
    );

    for (let cIdx = 0; cIdx < commenters.length; cIdx++) {
      const commenter = commenters[cIdx];
      const commentText = getRandomElement(config.discussions);
      const commentDate = new Date(
        new Date(parentPost.createdAt).getTime() + (cIdx + 1) * 12 * 60 * 1000
      );

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            groupId: group.id,
            parentId: parentPost.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 15) + 2,
            createdAt: commentDate,
            updatedAt: commentDate,
          },
        });
        totalComments++;
      } catch (err) {
        console.error('Error creating reply:', err.message);
      }
    }

    await prisma.post
      .update({
        where: { id: parentPost.id },
        data: { replyCount: commentsCount },
      })
      .catch(() => {});
  }

  // 7. Update final group stats
  const totalPostsInGroup = await prisma.post.count({
    where: { groupId: group.id, parentId: null },
  });

  await prisma.group.update({
    where: { id: group.id },
    data: {
      memberCount: totalMembers,
      postCount: totalPostsInGroup,
    },
  });

  console.log(`🎉 Finished ${config.name}:`);
  console.log(`   - Posts: ${totalPostsInGroup}`);
  console.log(`   - Images: ${imagePostCount}`);
  console.log(`   - Videos: ${videoPostCount}`);
  console.log(`   - Comments: ${totalComments}`);
  console.log(`   - Members: ${totalMembers}`);
}

async function main() {
  const args = process.argv.slice(2);
  const filterHub = args.find((a) => a.startsWith('--hub='))?.split('=')[1];

  console.log('🌟 Starting VANTARA Entertainment Communities Seeder...\n');

  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });

  if (users.length === 0) {
    console.error('❌ No users found in database! Please run `npm run db:seed:users` first.');
    process.exit(1);
  }

  const rakaUser = users.find((u) => u.username === 'raka92');
  const adminUser = users.find((u) => u.username === 'varta_official') || users[0];

  const targets = filterHub
    ? HUB_CONFIGS.filter((h) => h.id.toLowerCase() === filterHub.toLowerCase())
    : HUB_CONFIGS;

  if (targets.length === 0) {
    console.error(`❌ No hub found matching filter: ${filterHub}`);
    console.log(`Available hubs: ${HUB_CONFIGS.map((h) => h.id).join(', ')}`);
    process.exit(1);
  }

  for (const hub of targets) {
    await seedHub(hub, users, adminUser, rakaUser);
  }

  console.log('\n======================================================');
  console.log('✨ ALL REQUESTED ENTERTAINMENT HUBS SEEDED SUCCESSFULLY!');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during entertainment seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

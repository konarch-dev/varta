const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

// Curated 200 OK working MP4 video sources with titles & dimensions
const VERIFIED_VIDEOS = [
  {
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 15400000,
    width: 1280,
    height: 720,
    category: 'nature',
  },
  {
    url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 8400000,
    width: 854,
    height: 480,
    category: 'cinema',
  },
  {
    url: 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4200000,
    width: 960,
    height: 540,
    category: 'animation',
  },
  {
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 3100000,
    width: 640,
    height: 360,
    category: 'nature',
  },
  {
    url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4800000,
    width: 720,
    height: 480,
    category: 'tech',
  },
  {
    url: 'https://www.w3schools.com/html/movie.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 3800000,
    width: 640,
    height: 360,
    category: 'nature',
  },
  {
    url: 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4200000,
    width: 960,
    height: 540,
    category: 'tech',
  },
  {
    url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4800000,
    width: 720,
    height: 480,
    category: 'tech',
  },
];

// Rich curated photos by category
const CURATED_IMAGES = {
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80',
  ],
  startup: [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1000&auto=format&fit=crop&q=80',
  ],
  cricket: [
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531415074868-036b1c575351?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000&auto=format&fit=crop&q=80',
  ],
  cities: [
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600100397608-f010f443b353?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1000&auto=format&fit=crop&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552611052-33e04de081de?w=1000&auto=format&fit=crop&q=80',
  ],
  nature: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1000&auto=format&fit=crop&q=80',
  ],
  design: [
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1000&auto=format&fit=crop&q=80',
  ],
};

// Rich variety of themed post templates
const POST_TEMPLATES = [
  // Tech & Engineering
  {
    content: 'Just refactored our real-time synchronization pipeline. Moved from heavy REST polling to Redis Pub/Sub + WebSockets. Latency dropped from 420ms to 24ms across 100k active connections! ⚡️💻 #TechIndia #SystemDesign #CodeLife',
    category: 'tech',
    mediaType: 'image',
    mediaCount: 1,
  },
  {
    content: 'Here is a sneak peek at the new high-framerate rendering pipeline we built for smooth feed transitions. Look at how buttery 60fps scrolling feels! 🚀🔥 #Frontend #Engineering #WebDev',
    category: 'tech',
    mediaType: 'video',
  },
  {
    content: 'Why is TypeScript strict mode still optional on so many legacy projects? Turning on `strictNullChecks` alone caught 30+ subtle production bugs in our codebase this morning. Make it standard! 🛡️ #TypeScript #WebDev',
    category: 'tech',
    mediaType: 'none',
  },
  {
    content: 'Deep diving into Postgres 17 query plan optimizer and B-Tree indexing. A single composite index on `(user_id, created_at DESC)` completely transformed our feed query times. Never guess index performance, always EXPLAIN ANALYZE! 📊🧠 #Postgres #Backend',
    category: 'tech',
    mediaType: 'image',
    mediaCount: 2,
  },
  {
    content: 'Building software in 2026 feels like having a superpower. AI handles the boilerplate, TypeScript catches the edge cases, and developers can focus on genuine user delight and architecture. What a time to build! 🇮🇳✨ #BaatSabki #TechIndia',
    category: 'tech',
    mediaType: 'none',
  },
  {
    content: 'What is your primary programming language for building high-scale web platforms in 2026? Vote below and share your stack! 👇 #TechIndia #Startups',
    category: 'tech',
    mediaType: 'poll',
    poll: {
      question: 'Primary backend language for production in 2026?',
      options: ['TypeScript / Node / NestJS', 'Go (Golang)', 'Rust', 'Python (FastAPI)'],
    },
  },
  {
    content: 'Setting up local developer environments should take 5 minutes with Docker Compose, not half a day of configuration debugging. Containerizing our multi-package monorepo was the highest ROI decision this quarter. 🐳 #DevOps #Docker',
    category: 'tech',
    mediaType: 'image',
    mediaCount: 1,
  },

  // Startups & Business
  {
    content: 'The depth of innovation emerging from Tier-2 and Tier-3 Indian cities right now is extraordinary. Solving genuine regional logistics, agri-tech supply chains, and vernacular finance. The real Bharat story is unfolding right here. 🇮🇳📈 #Startups #IndiaRising #BharatFirst',
    category: 'startup',
    mediaType: 'image',
    mediaCount: 1,
  },
  {
    content: 'Check out the energy inside our Bengaluru engineering hub today! Nothing beats in-person whiteboard problem-solving with the team. ☕️🚀 #StartupLife #Bengaluru #TechIndia',
    category: 'startup',
    mediaType: 'video',
  },
  {
    content: 'Rule #1 of early-stage startups: Talk to 5 real users every single day. Analytics dashboards show you what happened; direct user conversations reveal why it happened. Don’t hide behind metrics. 💡 #ProductManagement #Founders',
    category: 'startup',
    mediaType: 'none',
  },
  {
    content: 'Bootstrapping to profitability vs raising venture capital early on? We chose sustainable customer-funded growth, and the clarity it brings to product decisions is priceless. Freedom to build for users, not board slides. 💼🎯 #Startups #Entrepreneurship',
    category: 'startup',
    mediaType: 'poll',
    poll: {
      question: 'Which path would you choose for your next tech startup?',
      options: ['Bootstrapped & Profitable', 'Angel / Seed Funded', 'Venture Capital (Hyper-growth)', 'Crowdfunded / Community'],
    },
  },
  {
    content: 'Moments from our quarterly strategy offsite. 4 teams, 48 hours, 3 game-changing product releases planned for the next half. When talent aligns with shared vision, magic happens. ✨ #TeamWork #CompanyCulture',
    category: 'startup',
    mediaType: 'image',
    mediaCount: 3,
  },

  // Design & Creative
  {
    content: 'Exploring dark-mode palette designs inspired by night skies over Jaipur. Contrast ratio 14.2:1 with electric blue highlights. How does this aesthetic feel? #DesignInBharat #BaatSabki',
    category: 'design',
    mediaType: 'image',
    mediaCount: 2,
  },
  {
    content: 'Typography is 90% of user interface design. Choosing the right line-height, letter-spacing, and font pairing transforms a cold layout into a warm, inviting reading experience. Stop designing with default system fonts! 🎨✍️ #UIUX #DesignSystem',
    category: 'design',
    mediaType: 'image',
    mediaCount: 1,
  },
  {
    content: 'Mesmerizing fluid motion study we created for interactive button states and card expansions. Notice the subtle micro-bounce easing curves! 🪄✨ #UIUX #MotionDesign',
    category: 'design',
    mediaType: 'video',
  },
  {
    content: 'Good design is obvious. Great design is transparent. If the user has to stop and think about how to navigate your app, the interface has failed its primary objective. Simplify ruthlessly. 📐🤍 #DesignPhilosophy',
    category: 'design',
    mediaType: 'none',
  },

  // Cricket & Sports
  {
    content: 'Incredible spell of fast bowling today! The seam position and late reverse swing at 145 km/h is sheer masterclass. Cricket season is officially here! 🏏🔥 #Cricket #TeamIndia',
    category: 'cricket',
    mediaType: 'image',
    mediaCount: 1,
  },
  {
    content: 'Reliving this electric stadium roar under the night floodlights! 60,000 voices singing as one. There is nothing in global sports that matches the energy of an Indian cricket stadium! 🏟️🇮🇳 #CricketFever #BleedBlue',
    category: 'cricket',
    mediaType: 'video',
  },
  {
    content: 'Who is your pick for the most impactful match-winner in T20 cricket right now? Cast your vote and let the passionate debate begin! 👇🏏 #Cricket #IPL',
    category: 'cricket',
    mediaType: 'poll',
    poll: {
      question: 'Most impactful T20 match-winner right now?',
      options: ['Jasprit Bumrah', 'Virat Kohli', 'Heinrich Klaasen', 'Travis Head'],
    },
  },
  {
    content: '5:30 AM 10km run completed through the misty park trails. The discipline of daily cardiovascular fitness clears the mental cobwebs faster than any espresso shot. Move your body every single day! 🏃‍♂️💨 #FitnessFirst #MorningRoutine',
    category: 'cricket',
    mediaType: 'none',
  },

  // Cities, Travel & Culture
  {
    content: 'Sunrise over Mumbai sea link. The city that never sleeps waking up to golden hues over the Arabian Sea. Every day here begins with hustle, hope, and unfiltered energy. 🌅🌊 #MumbaiMeriJaan #IncredibleIndia',
    category: 'cities',
    mediaType: 'image',
    mediaCount: 1,
  },
  {
    content: 'Breathtaking coastal footage captured along the pristine shores. Listen to the ocean rhythm wash away all weekly stress. 🌊✨ #TravelDiaries #PeacefulMoments',
    category: 'cities',
    mediaType: 'video',
  },
  {
    content: 'Weekend escape into the Western Ghats. Monsoon clouds rolling over emerald valleys, cascading waterfalls, and the unmistakable scent of wet earth (petrichor). Nature’s best reset button. 🌧️⛰️ #NatureLovers #Wanderlust',
    category: 'nature',
    mediaType: 'image',
    mediaCount: 4,
  },
  {
    content: 'What is the undisputed food capital of India? Settle this ultimate foodie argument once and for all! 🍽️😋 #Foodie #IndianFood',
    category: 'food',
    mediaType: 'poll',
    poll: {
      question: 'Which city has the best food culture in India?',
      options: ['Delhi (Street Food & Chaat)', 'Mumbai (Vada Pav & Coastal)', 'Hyderabad (Biryani & Haleem)', 'Kolkata (Kathi Rolls & Sweets)'],
    },
  },
  {
    content: 'A steaming glass of ginger cardamom masala chai alongside hot piping samosas while rain lashes against the cafe window. Some simple joys in life simply cannot be improved upon. ☕️🌧️ #ChaiTime #MonsoonVibes',
    category: 'food',
    mediaType: 'image',
    mediaCount: 2,
  },

  // AI & Future Tech
  {
    content: 'Running local open-weight 70B parameter LLMs entirely on consumer hardware at 45 tokens/second. The decentralization of machine intelligence is moving at an exponential pace. Developers will own their inference pipelines! 🤖⚡️ #OpenSource #AI #MachineLearning',
    category: 'tech',
    mediaType: 'image',
    mediaCount: 1,
  },
  {
    content: 'Will artificial general intelligence (AGI) be achieved before 2028? Where do you stand on the AI progress curve? 🔮🤖 #ArtificialIntelligence #TechTrends',
    category: 'tech',
    mediaType: 'poll',
    poll: {
      question: 'When do you anticipate human-level AGI?',
      options: ['By end of 2026', '2027 - 2028', '2029 - 2032', 'Not before 2035+'],
    },
  },
  {
    content: 'The convergence of robotics, spatial computing, and on-device vision is about to transform manufacturing and logistics in India. We are witnessing the Fourth Industrial Revolution firsthand. 🦾🇮🇳 #DeepTech #MakeInIndia',
    category: 'tech',
    mediaType: 'video',
  },

  // Cinema & Entertainment
  {
    content: 'Indian cinema’s technical craft over the past 3 years has elevated to world-class standards. From Dolby Atmos sound design to grand scale action choreography and world-building. Audiences deserve big-screen spectacles! 🎬🍿 #IndianCinema #Filmmaking',
    category: 'design',
    mediaType: 'image',
    mediaCount: 1,
  },
  {
    content: 'Cinematic teaser breakdown! Look at this incredible color grading, lighting contrast, and atmospheric score. Pure visual poetry! 🎥🍿 #Cinema #VisualCraft',
    category: 'design',
    mediaType: 'video',
  },
  {
    content: 'Favorite way to unwind on a Friday evening? Let us hear your vibe! 🎶🍿 #WeekendVibes #ChillTime',
    category: 'design',
    mediaType: 'poll',
    poll: {
      question: 'Your ideal Friday night plan?',
      options: ['Binge-watching a gripping thriller', 'Live music gig or dinner with friends', 'Late night coding session & chill beats', 'Deep sleep & relaxing book'],
    },
  },
];

// Contextual realistic comments/replies pool
const COMMENTS_POOL = [
  '100% agreed! This is such a spot-on perspective. More people need to talk about this.',
  'Brilliant breakdown! We faced the exact same bottleneck in production last month.',
  'Could not agree more with this point. Thanks for sharing this detailed insight! 👏',
  'This is genuinely inspiring. The attention to detail here is next level! 🔥',
  'Super interesting take! Would love to know how you handled the edge cases with latency?',
  'That visual looks stunning! What camera or setup was used for this shot? 📸',
  'Totally on point. The difference in performance is night and day once you optimize this.',
  'Bookmarking this thread immediately. Essential knowledge for anyone building in this space! 🔖',
  'Incredible execution! Sending congratulations to you and the entire team on this milestone 🚀',
  'The energy in this post is contagious. Keep inspiring the community! 🙌',
  'Haha so relatable! Experienced this exact scenario yesterday afternoon 😅',
  'Clean aesthetics and rock-solid architecture. That is how modern software should be built! 💻✨',
  'Nothing beats this feeling! Savor every bit of the journey ☕️',
  'Breathtaking visuals. India’s diversity and beauty never fails to amaze me 🇮🇳❤️',
  'Spot on analysis! Looking forward to part two of this discussion.',
  'This deserves way more visibility. Reposting to my network! 🔁',
  'That transition animation is buttery smooth! Is that CSS or Framer Motion?',
  'Such high quality content! Proud to be part of the VARTA community 🇮🇳✨',
  'Spot on. Simplicity is indeed the ultimate sophistication in product design.',
  'Masterclass! Following your updates closely from now on.',
];

// Replies specially tailored for raka92 posts
const RAKA_REPLIES = [
  'Spot on @raka92! Markets are definitely reacting big to this news 📈🔥',
  'Massive momentum! Thanks for highlighting this trend @raka92 🚀',
  'This is going viral across feeds! Totally agree with your analysis @raka92 🙌',
  'Incredible update @raka92! Keep bringing these live market insights.',
  'Haha absolutely rocks! Waiting for the next update @raka92 🔥',
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function extractHashtags(text) {
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  return matches ? matches.map((m) => m.slice(1).toLowerCase()) : [];
}

async function main() {
  console.log('🌱 Starting comprehensive post & comments seeding for all users...\n');

  // 1. Fetch all existing users from database
  const users = await prisma.user.findMany({
    include: {
      profile: true,
    },
  });

  if (users.length === 0) {
    console.error('❌ No users found in database! Please run `npm run db:seed:users` first.');
    process.exit(1);
  }

  console.log(`👥 Found ${users.length} registered users in the database.`);

  const rakaUser = users.find((u) => u.username === 'raka92');
  const adminUser = users.find((u) => u.username === 'varta_official');

  // 2. Map existing hashtags or prepare storage
  const hashtagCache = new Map();
  const existingTags = await prisma.hashtag.findMany();
  for (const t of existingTags) {
    hashtagCache.set(t.tag, t.id);
  }

  async function getOrCreateHashtag(tag) {
    const clean = tag.toLowerCase();
    if (hashtagCache.has(clean)) {
      await prisma.hashtag.update({
        where: { tag: clean },
        data: { usageCount: { increment: 1 } },
      });
      return hashtagCache.get(clean);
    }
    const created = await prisma.hashtag.upsert({
      where: { tag: clean },
      update: { usageCount: { increment: 1 } },
      create: { tag: clean, usageCount: 1 },
    });
    hashtagCache.set(clean, created.id);
    return created.id;
  }

  // 3. Create top-level posts for EACH user
  console.log('📝 Generating random rich posts (images, playable videos, polls, text) for each user...');

  const createdPosts = [];
  let videoPostCount = 0;
  let imagePostCount = 0;
  let pollPostCount = 0;
  let textPostCount = 0;

  // Stagger timestamps across the past 14 days
  const now = Date.now();
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    // Each user authors between 1 and 3 posts (featured/admin users author 3-4)
    const postCountForUser = (user.username === 'raka92' || user.username === 'varta_official' || i < 15) ? 3 : (1 + (i % 2));

    for (let pIdx = 0; pIdx < postCountForUser; pIdx++) {
      // Pick a random template
      const template = getRandomElement(POST_TEMPLATES);

      // Random timestamp between 14 days ago and 15 minutes ago
      const randomOffset = Math.floor(Math.random() * (TWO_WEEKS_MS - 900000)) + 900000;
      const postCreatedAt = new Date(now - randomOffset);

      // Prepare media attachments
      const mediaCreateData = [];

      if (template.mediaType === 'video') {
        const video = getRandomElement(VERIFIED_VIDEOS);
        mediaCreateData.push({
          type: 'VIDEO',
          url: video.url,
          thumbnailUrl: video.thumbnailUrl,
          mimeType: video.mimeType,
          sizeBytes: video.sizeBytes,
          width: video.width,
          height: video.height,
          order: 0,
        });
        videoPostCount++;
      } else if (template.mediaType === 'image') {
        const categoryImages = CURATED_IMAGES[template.category] || CURATED_IMAGES.tech;
        const count = template.mediaCount || 1;
        const selectedImages = getRandomSubarray(categoryImages, count);
        selectedImages.forEach((url, idx) => {
          mediaCreateData.push({
            type: 'IMAGE',
            url,
            thumbnailUrl: url,
            mimeType: 'image/jpeg',
            sizeBytes: 1200000 + idx * 80000,
            width: 1200,
            height: 800,
            order: idx,
          });
        });
        imagePostCount++;
      } else if (template.mediaType === 'poll') {
        pollPostCount++;
      } else {
        textPostCount++;
      }

      // Initial engagement estimates (will be supplemented with real Like/Repost records below)
      const likeCount = Math.floor(Math.random() * 35) + 5;
      const repostCount = Math.floor(Math.random() * 8) + 1;
      const bookmarkCount = Math.floor(Math.random() * 5);

      try {
        const post = await prisma.post.create({
          data: {
            authorId: user.id,
            content: template.content,
            likeCount,
            repostCount,
            bookmarkCount,
            createdAt: postCreatedAt,
            updatedAt: postCreatedAt,
            ...(mediaCreateData.length > 0 && {
              media: {
                create: mediaCreateData,
              },
            }),
            ...(template.poll && {
              poll: {
                create: {
                  question: template.poll.question,
                  expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000), // 7 days in future
                  options: {
                    create: template.poll.options.map((optText, optIdx) => ({
                      text: optText,
                      voteCount: Math.floor(Math.random() * 45) + 5,
                      order: optIdx,
                    })),
                  },
                },
              },
            }),
          },
        });

        // Link hashtags
        const tags = extractHashtags(template.content);
        for (const tag of tags) {
          const hId = await getOrCreateHashtag(tag);
          await prisma.postHashtag.create({
            data: {
              postId: post.id,
              hashtagId: hId,
            },
          }).catch(() => {});
        }

        createdPosts.push(post);
      } catch (err) {
        console.error(`Error creating post for @${user.username}:`, err.message);
      }
    }

    if ((i + 1) % 20 === 0 || i === users.length - 1) {
      console.log(`[${i + 1}/${users.length}] Users processed — ${createdPosts.length} posts generated.`);
    }
  }

  console.log(`\n✅ Generated ${createdPosts.length} top-level posts across all users!`);
  console.log(`   - 📸 Image posts: ${imagePostCount}`);
  console.log(`   - 🎬 Video posts: ${videoPostCount}`);
  console.log(`   - 📊 Poll posts: ${pollPostCount}`);
  console.log(`   - 💬 Text posts: ${textPostCount}`);

  // Also include any preexisting top-level posts (like raka92's posts) for replies and likes!
  const allTopLevelPosts = await prisma.post.findMany({
    where: { parentId: null },
    select: { id: true, authorId: true, content: true, createdAt: true },
  });

  console.log(`\n💬 Generating realistic threaded comments/replies from EACH user...`);
  const replyCountsMap = new Map();
  let totalCommentsCreated = 0;

  // 4. Generate comments from EACH user
  for (let i = 0; i < users.length; i++) {
    const commenter = users[i];
    // Each user writes 1 to 3 comments across various posts
    const commentsToWrite = 1 + (i % 3);

    // Pick posts authored by someone else to comment on
    const eligiblePosts = allTopLevelPosts.filter((p) => p.authorId !== commenter.id);
    const targetPosts = getRandomSubarray(eligiblePosts, Math.min(commentsToWrite, eligiblePosts.length));

    for (const targetPost of targetPosts) {
      // Comment timestamp: 15 mins to 8 hours after the post was created, but not in the future
      const postTime = new Date(targetPost.createdAt).getTime();
      const delayMs = Math.floor(Math.random() * (6 * 60 * 60 * 1000)) + 15 * 60 * 1000;
      const commentTime = new Date(Math.min(now - 60000, postTime + delayMs));

      const commentContent = getRandomElement(COMMENTS_POOL);
      const commentLikes = Math.floor(Math.random() * 12);

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            parentId: targetPost.id,
            content: commentContent,
            likeCount: commentLikes,
            createdAt: commentTime,
            updatedAt: commentTime,
          },
        });

        replyCountsMap.set(targetPost.id, (replyCountsMap.get(targetPost.id) || 0) + 1);
        totalCommentsCreated++;
      } catch (err) {
        console.error(`Error adding comment from @${commenter.username}:`, err.message);
      }
    }

    if ((i + 1) % 25 === 0 || i === users.length - 1) {
      console.log(`[${i + 1}/${users.length}] Users commented — ${totalCommentsCreated} comments created.`);
    }
  }

  // Ensure raka92's posts receive special engagement from community users!
  if (rakaUser) {
    const rakaPosts = allTopLevelPosts.filter((p) => p.authorId === rakaUser.id);
    console.log(`\n🌟 Enhancing engagement on @raka92's posts (${rakaPosts.length} posts found)...`);

    for (const rPost of rakaPosts) {
      // 3 to 5 users reply to raka's post
      const responders = getRandomSubarray(
        users.filter((u) => u.id !== rakaUser.id),
        4
      );

      for (let rIdx = 0; rIdx < responders.length; rIdx++) {
        const responder = responders[rIdx];
        const rContent = RAKA_REPLIES[rIdx % RAKA_REPLIES.length];
        const rTime = new Date(new Date(rPost.createdAt).getTime() + (rIdx + 1) * 20 * 60 * 1000);

        try {
          const comment = await prisma.post.create({
            data: {
              authorId: responder.id,
              parentId: rPost.id,
              content: rContent,
              likeCount: Math.floor(Math.random() * 8) + 2,
              createdAt: rTime,
              updatedAt: rTime,
            },
          });

          // Also generate notification for raka92
          await prisma.notification.create({
            data: {
              userId: rakaUser.id,
              actorId: responder.id,
              type: 'REPLY',
              entityId: comment.id,
              message: 'replied to your post',
              isRead: false,
              createdAt: rTime,
            },
          }).catch(() => {});

          replyCountsMap.set(rPost.id, (replyCountsMap.get(rPost.id) || 0) + 1);
          totalCommentsCreated++;
        } catch (err) {
          console.error('Error adding special reply to raka post:', err.message);
        }
      }
    }
  }

  // 5. Update replyCount on all parent posts to be 100% accurate
  console.log('\n🔄 Reconciling and updating replyCount on all parent posts...');
  for (const [postId, replyIncrement] of replyCountsMap.entries()) {
    await prisma.post.update({
      where: { id: postId },
      data: {
        replyCount: {
          increment: replyIncrement,
        },
      },
    }).catch(() => {});
  }

  // 6. Generate real Social Graph Likes, Reposts, and Bookmarks
  console.log('\n❤️ Generating authentic Likes, Reposts, and Bookmarks across posts...');

  const allPostsForSocial = await prisma.post.findMany({
    select: { id: true, authorId: true, parentId: true },
  });

  const likeRecords = [];
  const repostRecords = [];
  const bookmarkRecords = [];
  const notificationRecords = [];
  const likedPairs = new Set();
  const repostedPairs = new Set();
  const bookmarkedPairs = new Set();

  for (const p of allPostsForSocial) {
    // Top-level posts get 8-30 likes; replies get 0-8 likes
    const isTopLevel = p.parentId === null;
    const numLikes = isTopLevel ? Math.floor(Math.random() * 22) + 8 : Math.floor(Math.random() * 6);
    const numReposts = isTopLevel ? Math.floor(Math.random() * 8) + 1 : 0;
    const numBookmarks = isTopLevel ? Math.floor(Math.random() * 5) : 0;

    // Pick random likers
    const likers = getRandomSubarray(users, numLikes);
    for (const liker of likers) {
      const key = `${liker.id}_${p.id}`;
      if (!likedPairs.has(key)) {
        likedPairs.add(key);
        likeRecords.push({ userId: liker.id, postId: p.id });

        // Add notification for raka92 or admin
        if (p.authorId !== liker.id && (p.authorId === rakaUser?.id || Math.random() < 0.05)) {
          notificationRecords.push({
            userId: p.authorId,
            actorId: liker.id,
            type: 'LIKE',
            entityId: p.id,
            message: 'liked your post',
            isRead: false,
          });
        }
      }
    }

    // Reposts
    const reposters = getRandomSubarray(users, numReposts);
    for (const reposter of reposters) {
      const key = `${reposter.id}_${p.id}`;
      if (!repostedPairs.has(key)) {
        repostedPairs.add(key);
        repostRecords.push({ userId: reposter.id, postId: p.id });
      }
    }

    // Bookmarks
    const bookmarkers = getRandomSubarray(users, numBookmarks);
    for (const bookmarker of bookmarkers) {
      const key = `${bookmarker.id}_${p.id}`;
      if (!bookmarkedPairs.has(key)) {
        bookmarkedPairs.add(key);
        bookmarkRecords.push({ userId: bookmarker.id, postId: p.id });
      }
    }
  }

  // Insert in batches
  console.log(`Inserting ${likeRecords.length} Likes...`);
  for (let i = 0; i < likeRecords.length; i += 500) {
    await prisma.like.createMany({
      data: likeRecords.slice(i, i + 500),
      skipDuplicates: true,
    });
  }

  console.log(`Inserting ${repostRecords.length} Reposts...`);
  for (let i = 0; i < repostRecords.length; i += 500) {
    await prisma.repost.createMany({
      data: repostRecords.slice(i, i + 500),
      skipDuplicates: true,
    });
  }

  console.log(`Inserting ${bookmarkRecords.length} Bookmarks...`);
  for (let i = 0; i < bookmarkRecords.length; i += 500) {
    await prisma.bookmark.createMany({
      data: bookmarkRecords.slice(i, i + 500),
      skipDuplicates: true,
    });
  }

  if (notificationRecords.length > 0) {
    console.log(`Inserting ${notificationRecords.length} live Notifications...`);
    for (let i = 0; i < notificationRecords.length; i += 500) {
      await prisma.notification.createMany({
        data: notificationRecords.slice(i, i + 500),
        skipDuplicates: true,
      });
    }
  }

  // 7. Update likeCount, repostCount, bookmarkCount on all posts
  console.log('Synchronizing exact counters across all posts...');
  for (const p of allPostsForSocial) {
    const [lCount, rCount, bCount] = await Promise.all([
      prisma.like.count({ where: { postId: p.id } }),
      prisma.repost.count({ where: { postId: p.id } }),
      prisma.bookmark.count({ where: { postId: p.id } }),
    ]);

    await prisma.post.update({
      where: { id: p.id },
      data: {
        likeCount: lCount,
        repostCount: rCount,
        bookmarkCount: bCount,
      },
    }).catch(() => {});
  }

  // 8. Verification & Final Summary
  const finalPostsCount = await prisma.post.count({ where: { parentId: null } });
  const finalCommentsCount = await prisma.post.count({ where: { parentId: { not: null } } });
  const finalMediaCount = await prisma.postMedia.count();
  const finalVideosCount = await prisma.postMedia.count({ where: { type: 'VIDEO' } });
  const finalImagesCount = await prisma.postMedia.count({ where: { type: 'IMAGE' } });
  const finalLikesCount = await prisma.like.count();
  const finalRepostsCount = await prisma.repost.count();
  const finalBookmarksCount = await prisma.bookmark.count();
  const finalHashtagsCount = await prisma.hashtag.count();

  console.log('\n========================================');
  console.log('🎉 VARTA SOCIAL SEEDING COMPLETED!');
  console.log('========================================');
  console.log(`📊 FINAL DATABASE COUNTS:`);
  console.log(`- 👥 Total Users:               ${users.length}`);
  console.log(`- 📝 Total Top-Level Posts:     ${finalPostsCount}`);
  console.log(`- 💬 Total Comments/Replies:    ${finalCommentsCount}`);
  console.log(`- 🖼️ Total Images Attached:     ${finalImagesCount}`);
  console.log(`- 🎬 Total Playable Videos:     ${finalVideosCount}`);
  console.log(`- ❤️ Total Likes Recorded:      ${finalLikesCount}`);
  console.log(`- 🔁 Total Reposts:             ${finalRepostsCount}`);
  console.log(`- 🔖 Total Bookmarks:           ${finalBookmarksCount}`);
  console.log(`- #️⃣ Total Trending Hashtags:   ${finalHashtagsCount}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during post/comment seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

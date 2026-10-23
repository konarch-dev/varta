const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich posts for trending topics in the sidebar...');

  const users = await prisma.user.findMany({
    take: 8,
    include: { profile: true },
  });

  if (users.length === 0) {
    console.log('No users found in database');
    return;
  }

  const postsData = [
    {
      tag: 'WorldCup2026',
      displayTag: '#WorldCup2026',
      category: 'Sports · Trending',
      authorIndex: 0,
      content:
        "Team India's squad preparations for #WorldCup2026 are looking unstoppable! With young talent stepping up and the senior players in peak form, the tournament is going to be historic. Who is your player to watch? 🏏🇮🇳 #Sports #Cricket #TeamIndia #WorldCup2026",
      mediaUrl: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=800&auto=format&fit=crop&q=80',
    },
    {
      tag: 'WorldCup2026',
      displayTag: '#WorldCup2026',
      category: 'Sports · Trending',
      authorIndex: 1,
      content:
        'Unbelievable excitement in the stands! Road to #WorldCup2026 officially underway. Stadium vibes and fan support across India are electric! 🏟️⚡ #WorldCup2026 #TeamIndia',
      mediaUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
    },
    {
      tag: 'ISRO',
      displayTag: '#ISRO',
      category: 'Technology · Trending',
      authorIndex: 2,
      content:
        "Huge congratulations to @isro for the upcoming launch! India's space program continues to lead the world with precision engineering, indigenously developed thrusters, and cost-efficient exploration. Proud moment for Bharat! 🚀🌌 #ISRO #SpaceTech #Science",
      mediaUrl: 'https://images.unsplash.com/photo-1517976487508-3057e9309832?w=800&auto=format&fit=crop&q=80',
    },
    {
      tag: 'ISRO',
      displayTag: '#ISRO',
      category: 'Technology · Trending',
      authorIndex: 3,
      content:
        'Next phase of lunar base planning and space station deployment discussed at ISRO headquarters. The pace of technological innovation is mind-blowing. 🛰️✨ #ISRO #Technology #Space',
    },
    {
      tag: 'NewIndia',
      displayTag: '#NewIndia',
      category: 'Politics · Trending',
      authorIndex: 4,
      content:
        'High-speed rail corridors, state-of-the-art expressways, and digital public infrastructure — the transformation across urban and rural India is visible everywhere. Built by India, for the world. 🇮🇳🏗️ #NewIndia #Infrastructure #IndiaRising',
      mediaUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&auto=format&fit=crop&q=80',
    },
    {
      tag: 'NewIndia',
      displayTag: '#NewIndia',
      category: 'Politics · Trending',
      authorIndex: 0,
      content:
        "India's startup ecosystem now ranks #3 globally with over 120 unicorns. True entrepreneurial spirit driving the economy forward. 💼🚀 #NewIndia #DigitalIndia #Startups",
    },
    {
      tag: 'ElectricVehicles',
      displayTag: '#ElectricVehicles',
      category: 'Business · Trending',
      authorIndex: 1,
      content:
        'Massive milestone for clean mobility! EV adoption in India surges 45% year-on-year. New battery gigafactories and ultra-fast charging networks along national highways are game changers. ⚡🚗🔋 #ElectricVehicles #CleanEnergy #GreenMobility',
      mediaUrl: 'https://images.unsplash.com/photo-1558441719-8b489c63f7ce?w=800&auto=format&fit=crop&q=80',
    },
    {
      tag: 'ElectricVehicles',
      displayTag: '#ElectricVehicles',
      category: 'Business · Trending',
      authorIndex: 2,
      content:
        'Just test-drove the latest Indian-made EV. 500km range, lightning fast acceleration, and zero emissions. The future of Indian transport is already here! 🔌🌱 #ElectricVehicles #Innovation',
    },
    {
      tag: 'IncredibleIndia',
      displayTag: '#IncredibleIndia',
      category: 'Travel · Trending',
      authorIndex: 3,
      content:
        "From the majestic snow-capped peaks of the Himalayas to the tranquil backwaters of Kerala, India's diversity in culture, heritage, and geography never ceases to amaze. 🏔️🌴 #IncredibleIndia #Travel #Heritage",
      mediaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    },
    {
      tag: 'IncredibleIndia',
      displayTag: '#IncredibleIndia',
      category: 'Travel · Trending',
      authorIndex: 4,
      content:
        'Sunrise at the ancient ghats of Varanasi. The spiritual energy, temple bells, and serene waters of the Ganges — an unforgettable journey. 🛕🌅 #IncredibleIndia #Varanasi #Culture',
      mediaUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80',
    },
  ];

  for (const item of postsData) {
    const author = users[item.authorIndex % users.length];

    // Ensure hashtag exists in DB
    const cleanTag = item.tag.toLowerCase();
    const hashtag = await prisma.hashtag.upsert({
      where: { tag: cleanTag },
      update: { usageCount: { increment: 1 } },
      create: { tag: cleanTag, usageCount: 15 },
    });

    // Create the post
    const post = await prisma.post.create({
      data: {
        authorId: author.id,
        content: item.content,
        media: item.mediaUrl
          ? {
              create: {
                type: 'IMAGE',
                url: item.mediaUrl,
                mimeType: 'image/jpeg',
                sizeBytes: 102400,
              },
            }
          : undefined,
        hashtags: {
          create: {
            hashtagId: hashtag.id,
          },
        },
      },
    });

    console.log(`Created post ${post.id} for #${item.tag}`);
  }

  console.log('✅ All trending topics seeded with interactive posts!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

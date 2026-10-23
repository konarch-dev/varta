const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DM users and conversations for Konarch...');

  // 1. Find konarch user
  const konarch = await prisma.user.findFirst({
    where: {
      OR: [
        { username: 'konarch92' },
        { email: 'konarch@patterns247.net' },
        { email: 'konarch92@gmail.com' },
      ],
    },
    include: { profile: true },
  });

  if (!konarch) {
    console.error('❌ User Konarch not found in database!');
    return;
  }
  console.log(`✅ Found Konarch: ${konarch.username} (${konarch.id})`);

  const passwordHash = konarch.passwordHash;

  // 2. Upsert Ananya Sharma
  const ananya = await prisma.user.upsert({
    where: { username: 'ananyasharma' },
    update: {
      isVerified: true,
      profile: {
        upsert: {
          create: {
            displayName: 'Ananya Sharma',
            avatarUrl:
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
            bio: 'Traveler, shutterbug & storyteller 📸 | Exploring incredible India 🇮🇳',
          },
          update: {
            displayName: 'Ananya Sharma',
            avatarUrl:
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
          },
        },
      },
    },
    create: {
      username: 'ananyasharma',
      email: 'ananya@varta.local',
      passwordHash,
      isVerified: true,
      profile: {
        create: {
          displayName: 'Ananya Sharma',
          avatarUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
          bio: 'Traveler, shutterbug & storyteller 📸 | Exploring incredible India 🇮🇳',
        },
      },
    },
    include: { profile: true },
  });
  console.log(`✅ Upserted user: ${ananya.username} (${ananya.id})`);

  // 3. Upsert Rohit Verma
  const rohit = await prisma.user.upsert({
    where: { username: 'rohitverma' },
    update: {
      isVerified: true,
      profile: {
        upsert: {
          create: {
            displayName: 'Rohit Verma',
            avatarUrl:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
            bio: 'Tech enthusiast, content creator & foodie | Delhi 📍',
          },
          update: {
            displayName: 'Rohit Verma',
            avatarUrl:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
          },
        },
      },
    },
    create: {
      username: 'rohitverma',
      email: 'rohit@varta.local',
      passwordHash,
      isVerified: true,
      profile: {
        create: {
          displayName: 'Rohit Verma',
          avatarUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
          bio: 'Tech enthusiast, content creator & foodie | Delhi 📍',
        },
      },
    },
    include: { profile: true },
  });
  console.log(`✅ Upserted user: ${rohit.username} (${rohit.id})`);

  // 4. Upsert Tech India
  const techIndia = await prisma.user.upsert({
    where: { username: 'techindia' },
    update: {
      isVerified: true,
      profile: {
        upsert: {
          create: {
            displayName: 'Tech India',
            avatarUrl:
              'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=200&fit=crop',
            bio: 'Official Bharat Technology & Startup Insights 🚀 #DigitalIndia',
          },
          update: {
            displayName: 'Tech India',
            avatarUrl:
              'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=200&fit=crop',
          },
        },
      },
    },
    create: {
      username: 'techindia',
      email: 'techindia@varta.local',
      passwordHash,
      isVerified: true,
      profile: {
        create: {
          displayName: 'Tech India',
          avatarUrl:
            'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=200&fit=crop',
          bio: 'Official Bharat Technology & Startup Insights 🚀 #DigitalIndia',
        },
      },
    },
    include: { profile: true },
  });
  console.log(`✅ Upserted user: ${techIndia.username} (${techIndia.id})`);

  // Helper function to get or create conversation and seed messages
  async function setupConversation(targetUser, messages) {
    let conv = await prisma.conversation.findFirst({
      where: {
        AND: [
          { members: { some: { userId: konarch.id } } },
          { members: { some: { userId: targetUser.id } } },
        ],
      },
      include: { messages: true },
    });

    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          members: {
            create: [{ userId: konarch.id }, { userId: targetUser.id }],
          },
        },
        include: { messages: true },
      });
      console.log(`Created new conversation with ${targetUser.username}: ${conv.id}`);
    } else {
      console.log(`Found existing conversation with ${targetUser.username}: ${conv.id}`);
    }

    // If conversation has no messages, populate them
    if (conv.messages.length === 0) {
      for (const m of messages) {
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderId: m.fromTarget ? targetUser.id : konarch.id,
            content: m.content,
            createdAt: m.createdAt,
            isRead: true,
          },
        });
      }
      console.log(`Seeded ${messages.length} messages in conversation ${conv.id}`);
    }

    // Touch conversation updatedAt
    const latestMessage = await prisma.message.findFirst({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestMessage) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { updatedAt: latestMessage.createdAt },
      });
    }

    return conv;
  }

  const now = Date.now();

  // Seed Ananya conversation
  await setupConversation(ananya, [
    {
      fromTarget: true,
      content: 'Hey Konarch! Loved your recent post about Varanasi. The photos are amazing! ✨',
      createdAt: new Date(now - 25 * 60 * 1000),
    },
    {
      fromTarget: false,
      content: 'Thanks Ananya! It was an incredible experience. Planning another trip soon.',
      createdAt: new Date(now - 18 * 60 * 1000),
    },
    {
      fromTarget: true,
      content:
        'That’s great! Let’s connect. We are building a travel community on VARTA. Would love to have you there!',
      createdAt: new Date(now - 10 * 60 * 1000),
    },
  ]);

  // Seed Rohit conversation
  await setupConversation(rohit, [
    {
      fromTarget: true,
      content: 'Hey! Are you attending the creator meetup in Connaught Place this weekend?',
      createdAt: new Date(now - 3 * 60 * 60 * 1000),
    },
    {
      fromTarget: false,
      content: 'Yes Rohit, I am planning to be there around 4 PM.',
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    },
    {
      fromTarget: true,
      content: 'Sent a photo',
      createdAt: new Date(now - 60 * 60 * 1000),
    },
  ]);

  // Seed Tech India conversation
  await setupConversation(techIndia, [
    {
      fromTarget: true,
      content: 'We are launching a new space-tech sprint next week!',
      createdAt: new Date(now - 3 * 60 * 60 * 1000),
    },
  ]);

  console.log('🎉 Successfully seeded conversations and messages!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding messages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

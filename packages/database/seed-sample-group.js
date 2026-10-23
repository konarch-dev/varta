const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const konarch = await prisma.user.findFirst({
    where: { username: 'konarch92' },
  });
  const raka = await prisma.user.findFirst({
    where: { username: 'raka92' },
  });
  const aravind = await prisma.user.findFirst({
    where: { username: 'aravind_srinivas_ai' },
  });

  if (!konarch || !raka) {
    console.log('Required users not found');
    return;
  }

  const memberIds = [konarch.id, raka.id];
  if (aravind) memberIds.push(aravind.id);

  // Check if group already exists
  const existing = await prisma.conversation.findFirst({
    where: {
      title: '🚀 Varta Core Innovators',
      isGroup: true,
    },
  });

  if (existing) {
    console.log('Sample group already exists:', existing.id);
    return;
  }

  const group = await prisma.conversation.create({
    data: {
      title: '🚀 Varta Core Innovators',
      isGroup: true,
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
    },
  });

  // Add realistic chat messages from multiple members
  await prisma.message.create({
    data: {
      conversationId: group.id,
      senderId: raka.id,
      content: 'Hey everyone! Welcome to the Varta Core Innovators group! 🇮🇳',
    },
  });

  if (aravind) {
    await prisma.message.create({
      data: {
        conversationId: group.id,
        senderId: aravind.id,
        content: 'Excited to be here! The real-time messaging and voice call features are great.',
      },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: group.id,
      senderId: konarch.id,
      content: 'Thanks! Audio calls, video calls and group messaging are now fully active.',
    },
  });

  console.log('✅ Created sample group chat:', group.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

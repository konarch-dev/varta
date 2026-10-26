const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const password = 'AdminPassword123!';
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  // 1. Ensure user with username: 'admin' exists and is ADMIN
  const existingAdminUser = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (existingAdminUser) {
    await prisma.user.update({
      where: { id: existingAdminUser.id },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        passwordHash,
      },
    });
    console.log(`Updated user "admin" to active ADMIN.`);
  } else {
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'system.admin@varta.in',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            displayName: 'Admin User',
            bio: 'Chief System Administrator 🇮🇳',
          },
        },
      },
    });
    console.log(`Created new user "admin" with ADMIN role.`);
  }

  // 2. Also ensure 'konarch92' has password set and is ADMIN
  const konarch = await prisma.user.findUnique({
    where: { username: 'konarch92' },
  });
  if (konarch) {
    await prisma.user.update({
      where: { id: konarch.id },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        passwordHash,
      },
    });
    console.log(`Updated user "konarch92" to active ADMIN with password "${password}".`);
  }

  // 3. List all admin users
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, username: true, email: true, role: true, status: true },
  });

  console.log('\n================ Current Active Admins ================');
  for (const a of adminUsers) {
    console.log(`- Username: ${a.username} | Email: ${a.email} | Status: ${a.status}`);
  }
  console.log(`Default Password: ${password}`);
  console.log('=======================================================\n');
}

main()
  .catch((err) => {
    console.error('Error creating admin user:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

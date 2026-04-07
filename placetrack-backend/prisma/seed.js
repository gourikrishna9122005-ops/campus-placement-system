const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD, rounds);

  const admin = await prisma.admin.upsert({
    where: { email: process.env.ADMIN_DEFAULT_EMAIL },
    update: {},
    create: {
      name: 'Super Admin',
      email: process.env.ADMIN_DEFAULT_EMAIL,
      password_hash: hash,
    },
  });

  console.log(`✅ Default admin seeded: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

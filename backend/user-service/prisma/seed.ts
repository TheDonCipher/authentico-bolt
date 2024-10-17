// backend/user-service/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        userType: 'individual',
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        userType: 'organization',
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
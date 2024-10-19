import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear the database
  await prisma.user.deleteMany({});

  // Seed the database
  await prisma.user.createMany({
    data: [
      { name: 'Alice', email: 'alice@example.com', userType: 'individual' },
      { name: 'Bob', email: 'bob@example.com', userType: 'organization' },
    ],
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear the database
  await prisma.user.deleteMany({});

  // Seed the database
  await prisma.user.createMany({
    data: [
      { name: 'Alice', email: 'alice@example.com', userType: 'individual', walletAddress: '0x1234567890123456789012345678901234567890' },
      { name: 'Bob', email: 'bob@example.com', userType: 'organization', walletAddress: '0x0987654321098765432109876543210987654321' },
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

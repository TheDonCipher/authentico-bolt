// backend/user-service/src/crud.test.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a new user
  const newUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      userType: 'individual',
    },
  });
  console.log('Created user:', newUser);

  // Read the user
  const user = await prisma.user.findUnique({
    where: { email: 'john.doe@example.com' },
  });
  console.log('Read user:', user);

  // Update the user
  const updatedUser = await prisma.user.update({
    where: { email: 'john.doe@example.com' },
    data: { name: 'Jane Doe' },
  });
  console.log('Updated user:', updatedUser);

  // Delete the user
  const deletedUser = await prisma.user.delete({
    where: { email: 'john.doe@example.com' },
  });
  console.log('Deleted user:', deletedUser);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
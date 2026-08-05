import prisma from "../src/lib/db/prisma";
import { UserRole } from "../src/generated/prisma/enums";
const targetEmail = "goldcrownjumpers@gmail.com";

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: targetEmail,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error(`No user exists for ${targetEmail}.`);
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    console.log(`${targetEmail} is already a SUPER_ADMIN.`);
    return;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log(`Updated ${targetEmail} to SUPER_ADMIN.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


require("../config/env");

const prisma = require("../config/database");

async function createAdmin() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "Please provide an email address.\n" +
      "Usage: node src/scripts/createAdmin.js user@example.com"
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please provide a valid email address.");
  }

  // Prevent accidental creation of multiple bootstrap admins.
  const existingAdminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });

  if (existingAdminCount > 0) {
    throw new Error(
      "An ADMIN account already exists. Bootstrap operation cancelled."
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error(
      `No user found with email: ${email}. Register this user first.`
    );
  }

  if (!user.isActive) {
    throw new Error(
      "This account is inactive. Activate it before promoting it."
    );
  }

  if (user.role === "ADMIN") {
    throw new Error("This user is already an ADMIN.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  console.log("\n================================");
  console.log("ADMIN CREATED SUCCESSFULLY");
  console.log("================================");
  console.log(`Name:   ${updatedUser.name}`);
  console.log(`Email:  ${updatedUser.email}`);
  console.log(`Role:   ${updatedUser.role}`);
  console.log(`Active: ${updatedUser.isActive}`);
  console.log("================================\n");
}

createAdmin()
  .catch((error) => {
    console.error("\nADMIN CREATION FAILED:");
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

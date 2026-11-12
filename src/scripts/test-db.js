// Load environment variables from .env
require("dotenv").config();

// Import our Prisma Client
const prisma = require("../config/database");

async function testDatabaseConnection() {
  try {
    console.log("Connecting to Neon PostgreSQL...");

    // Establish database connection
    await prisma.$connect();

    console.log("Database connected successfully!");

    // Execute a simple SQL query
    const result = await prisma.$queryRaw`SELECT NOW() AS current_time`;

    console.log("Database response:", result);
    console.log("Connection test successful!");
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    // Close database connection
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
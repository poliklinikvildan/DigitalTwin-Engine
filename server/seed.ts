import { app, server } from "./index";
import { seedDatabase } from "./routes";

// Start the server and seed the database
(async () => {
  try {
    // Wait for the server to start (it's started in index.ts)
    // We can run the seed function here
    await seedDatabase();
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
})();

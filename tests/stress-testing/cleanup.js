// Quick cleanup script to remove junk categories created by stress tests
// Run with: node stress-final/cleanup.js

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const categories = db.collection("categories");

    // Find all junk categories created by stress tests
    const junkPatterns = [
      /^StressCat/,
      /^Cat-\d+/,
      /^PW_Cat/,
      /^Updated_StressCat/,
      /^CombCat_/,
      /^TMP CAT/,
    ];

    const filter = {
      $or: junkPatterns.map((pattern) => ({ name: { $regex: pattern } })),
    };

    const count = await categories.countDocuments(filter);
    console.log(`Found ${count} junk categories to delete`);

    if (count > 0) {
      const result = await categories.deleteMany(filter);
      console.log(`Deleted ${result.deletedCount} junk categories`);
    }

    // Also clean up junk users created by stress tests
    const users = db.collection("users");
    const userFilter = {
      $or: [
        { email: { $regex: /^stress_/ } },
        { email: { $regex: /^combined_/ } },
        { email: "stress.admin@test.com" },
        { email: "stress.user@test.com" },
      ],
    };

    const userCount = await users.countDocuments(userFilter);
    console.log(`Found ${userCount} junk users to delete`);

    if (userCount > 0) {
      const userResult = await users.deleteMany(userFilter);
      console.log(`Deleted ${userResult.deletedCount} junk users`);
    }

    await mongoose.disconnect();
    console.log("Cleanup complete");
  } catch (err) {
    console.error("Cleanup failed:", err.message);
    process.exit(1);
  }
}

cleanup();

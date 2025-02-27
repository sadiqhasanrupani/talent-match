import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default {
schema: "./lib/schema.ts",
out: "./drizzle",
dialect: "postgresql",
dbCredentials: {
    url: process.env.DATABASE_URL,
},
// Uncomment these options as needed:
// verbose: true,
// strict: true,
tablesFilter: ["!migrations*", "!_*"], // Exclude migration tables and tables starting with underscore
} satisfies Config;

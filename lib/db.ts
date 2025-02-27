import { drizzle } from "drizzle-orm/postgres-js";
import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";
import postgres from "postgres";

// Define the schema for the candidates table
export const candidates = pgTable("candidates", {
id: serial("id").primaryKey(),
name: varchar("name", { length: 255 }).notNull(),
email: varchar("email", { length: 255 }).notNull(),
linkedinUrl: varchar("linkedin_url", { length: 255 }),
resumeText: text("resume_text").notNull(),
skills: text("skills").notNull(),
createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Database connection string from environment variable
// Make sure to set DATABASE_URL in your .env file
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres";

// Create the connection
const client = postgres(connectionString);

// Create the Drizzle ORM instance
export const db = drizzle(client);

// Export type for the candidates table
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

// Export the schema for migrations
export const schema = { candidates };


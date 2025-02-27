import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  linkedinUrl: text("linkedin_url"),
  skills: text("skills").notNull(),
  resumeUrl: text("resume_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export types for type safety
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

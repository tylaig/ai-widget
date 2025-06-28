import { z } from "zod";
import { pgTable, text, boolean, timestamp, jsonb, varchar, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Agents Table
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  model: varchar("model", { length: 50 }).default("gpt-4o").notNull(),
  openaiAssistantId: varchar("openai_assistant_id", { length: 255 }),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  files: jsonb("files").$type<string[]>().default([]).notNull(),
  instructions: text("instructions"),
});

// Chat Threads Table
export const chatThreads = pgTable("chat_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentSlug: varchar("agent_slug", { length: 100 }).notNull(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  openaiThreadId: varchar("openai_thread_id", { length: 255 }),
  messages: jsonb("messages").$type<Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    audioUrl?: string;
  }>>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

// API Keys Table
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  openaiApiKey: text("openai_api_key").notNull(),
  isValid: boolean("is_valid").default(false).notNull(),
  lastValidated: timestamp("last_validated"),
});

// Relations
export const agentsRelations = relations(agents, ({ many }) => ({
  chatThreads: many(chatThreads),
}));

export const chatThreadsRelations = relations(chatThreads, ({ one }) => ({
  agent: one(agents, {
    fields: [chatThreads.agentSlug],
    references: [agents.slug],
  }),
}));

// Zod Schemas for API validation
export const agentInsertSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  model: z.string().default("gpt-4o"),
  openaiAssistantId: z.string().optional(),
  slug: z.string().min(1),
  isActive: z.boolean().default(true),
  files: z.array(z.string()).default([]),
  instructions: z.string().optional(),
});

export const chatThreadInsertSchema = z.object({
  agentSlug: z.string(),
  sessionId: z.string(),
  openaiThreadId: z.string().optional(),
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.string(),
    audioUrl: z.string().optional(),
  })).default([]),
});

export const apiKeyInsertSchema = z.object({
  openaiApiKey: z.string(),
  isValid: z.boolean().default(false),
});

// Types
export type Agent = typeof agents.$inferSelect;
export type AgentInsert = z.infer<typeof agentInsertSchema>;
export type ChatThread = typeof chatThreads.$inferSelect;
export type ChatThreadInsert = z.infer<typeof chatThreadInsertSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ApiKeyInsert = z.infer<typeof apiKeyInsertSchema>;

// Widget Configuration Schema
export const widgetConfigSchema = z.object({
  agentSlug: z.string(),
  theme: z.enum(["light", "dark", "auto"]).default("light"),
  enableAudio: z.boolean().default(true),
  primaryColor: z.string().default("#007bff"),
  position: z.enum(["bottom-right", "bottom-left"]).default("bottom-right"),
  welcomeMessage: z.string().optional(),
});

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;

// Chat Message Schema for API
export const chatMessageSchema = z.object({
  content: z.string(),
  agentSlug: z.string(),
  sessionId: z.string(),
  audioData: z.string().optional(), // base64 encoded audio
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
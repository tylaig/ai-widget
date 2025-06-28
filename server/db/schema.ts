import { pgTable, varchar, boolean, text, jsonb } from 'drizzle-orm/pg-core';

export const agents = pgTable('agents', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  model: varchar('model', { length: 64 }).notNull(),
  openaiAssistantId: varchar('openai_assistant_id', { length: 128 }),
  slug: varchar('slug', { length: 128 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastUpdated: varchar('last_updated', { length: 64 }).notNull(),
  files: jsonb('files').notNull().default([]),
  instructions: text('instructions'),
});

export const chatThreads = pgTable('chat_threads', {
  id: varchar('id', { length: 64 }).primaryKey(),
  agentSlug: varchar('agent_slug', { length: 128 }).notNull(),
  sessionId: varchar('session_id', { length: 128 }).notNull(),
  openaiThreadId: varchar('openai_thread_id', { length: 128 }),
  messages: jsonb('messages').notNull().default([]),
  createdAt: varchar('created_at', { length: 64 }).notNull(),
  lastMessageAt: varchar('last_message_at', { length: 64 }).notNull(),
});

export const apiKeys = pgTable('api_keys', {
  id: varchar('id', { length: 64 }).primaryKey(),
  openaiApiKey: varchar('openai_api_key', { length: 128 }).notNull(),
  isValid: boolean('is_valid').notNull().default(false),
  lastValidated: varchar('last_validated', { length: 64 }),
}); 
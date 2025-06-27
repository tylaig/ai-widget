import { z } from "zod";

// Agent Schema
export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  model: z.string().default("gpt-4o"),
  openaiAssistantId: z.string().optional(),
  slug: z.string(),
  isActive: z.boolean().default(true),
  lastUpdated: z.string(),
  files: z.array(z.string()).default([]),
  instructions: z.string().optional(),
});

export const agentInsertSchema = agentSchema.omit({ id: true, lastUpdated: true });
export type Agent = z.infer<typeof agentSchema>;
export type AgentInsert = z.infer<typeof agentInsertSchema>;

// Chat Thread Schema
export const chatThreadSchema = z.object({
  id: z.string(),
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
  createdAt: z.string(),
  lastMessageAt: z.string(),
});

export const chatThreadInsertSchema = chatThreadSchema.omit({ id: true, createdAt: true, lastMessageAt: true });
export type ChatThread = z.infer<typeof chatThreadSchema>;
export type ChatThreadInsert = z.infer<typeof chatThreadInsertSchema>;

// API Key Schema
export const apiKeySchema = z.object({
  id: z.string(),
  openaiApiKey: z.string(),
  isValid: z.boolean().default(false),
  lastValidated: z.string().optional(),
});

export const apiKeyInsertSchema = apiKeySchema.omit({ id: true });
export type ApiKey = z.infer<typeof apiKeySchema>;
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
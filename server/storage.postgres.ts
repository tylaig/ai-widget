import { IStorage } from './storage';
import { db } from './db/client';
import { agents, chatThreads, apiKeys } from './db/schema';
import { Agent, AgentInsert, ChatThread, ChatThreadInsert, ApiKey, ApiKeyInsert } from '../shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

export class PostgresStorage implements IStorage {
  async createAgent(agent: AgentInsert): Promise<Agent> {
    const id = uuidv4();
    const lastUpdated = new Date().toISOString();
    await db.insert(agents).values({
      id,
      name: agent.name,
      description: agent.description ?? null,
      model: agent.model ?? 'gpt-4o',
      openaiAssistantId: agent.openaiAssistantId ?? null,
      slug: agent.slug,
      isActive: agent.isActive ?? true,
      lastUpdated,
      files: agent.files ?? [],
      instructions: agent.instructions ?? null,
    });
    const [created] = await db.select().from(agents).where(eq(agents.id, id));
    return created as Agent;
  }

  async getAgent(id: string): Promise<Agent | null> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent as Agent || null;
  }

  async getAgentBySlug(slug: string): Promise<Agent | null> {
    const [agent] = await db.select().from(agents).where(eq(agents.slug, slug));
    return agent as Agent || null;
  }

  async getAllAgents(): Promise<Agent[]> {
    const result = await db.select().from(agents);
    return result as Agent[];
  }

  async updateAgent(id: string, agent: Partial<AgentInsert>): Promise<Agent | null> {
    const lastUpdated = new Date().toISOString();
    await db.update(agents).set({ ...agent, lastUpdated }).where(eq(agents.id, id));
    const [updated] = await db.select().from(agents).where(eq(agents.id, id));
    return updated as Agent || null;
  }

  async deleteAgent(id: string): Promise<boolean> {
    const result = await db.delete(agents).where(eq(agents.id, id));
    return result.rowCount > 0;
  }

  async createChatThread(thread: ChatThreadInsert): Promise<ChatThread> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await db.insert(chatThreads).values({
      id,
      agentSlug: thread.agentSlug,
      sessionId: thread.sessionId,
      openaiThreadId: thread.openaiThreadId ?? null,
      messages: thread.messages ?? [],
      createdAt: now,
      lastMessageAt: now,
    });
    const [created] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
    return created as ChatThread;
  }

  async getChatThread(id: string): Promise<ChatThread | null> {
    const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
    return thread as ChatThread || null;
  }

  async getChatThreadBySession(agentSlug: string, sessionId: string): Promise<ChatThread | null> {
    const [thread] = await db.select().from(chatThreads).where(and(eq(chatThreads.agentSlug, agentSlug), eq(chatThreads.sessionId, sessionId)));
    return thread as ChatThread || null;
  }

  async updateChatThread(id: string, thread: Partial<ChatThread>): Promise<ChatThread | null> {
    const lastMessageAt = new Date().toISOString();
    await db.update(chatThreads).set({ ...thread, lastMessageAt }).where(eq(chatThreads.id, id));
    const [updated] = await db.select().from(chatThreads).where(eq(chatThreads.id, id));
    return updated as ChatThread || null;
  }

  async setApiKey(apiKey: ApiKeyInsert): Promise<ApiKey> {
    const id = uuidv4();
    await db.insert(apiKeys).values({
      id,
      openaiApiKey: apiKey.openaiApiKey,
      isValid: apiKey.isValid ?? false,
      lastValidated: apiKey.lastValidated ?? null,
    });
    const [created] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return created as ApiKey;
  }

  async getApiKey(): Promise<ApiKey | null> {
    const result = await db.select().from(apiKeys);
    return result.length > 0 ? (result[0] as ApiKey) : null;
  }

  async updateApiKey(id: string, apiKey: Partial<ApiKeyInsert>): Promise<ApiKey | null> {
    const lastValidated = new Date().toISOString();
    await db.update(apiKeys).set({ ...apiKey, lastValidated }).where(eq(apiKeys.id, id));
    const [updated] = await db.select().from(apiKeys).where(eq(apiKeys.id, id));
    return updated as ApiKey || null;
  }
} 
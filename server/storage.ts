import { Agent, AgentInsert, ChatThread, ChatThreadInsert, ApiKey, ApiKeyInsert, agents, chatThreads, apiKeys } from "../shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Agent operations
  createAgent(agent: AgentInsert): Promise<Agent>;
  getAgent(id: string): Promise<Agent | null>;
  getAgentBySlug(slug: string): Promise<Agent | null>;
  getAllAgents(): Promise<Agent[]>;
  updateAgent(id: string, agent: Partial<AgentInsert>): Promise<Agent | null>;
  deleteAgent(id: string): Promise<boolean>;

  // Chat Thread operations
  createChatThread(thread: ChatThreadInsert): Promise<ChatThread>;
  getChatThread(id: string): Promise<ChatThread | null>;
  getChatThreadBySession(agentSlug: string, sessionId: string): Promise<ChatThread | null>;
  updateChatThread(id: string, thread: Partial<ChatThread>): Promise<ChatThread | null>;

  // API Key operations
  setApiKey(apiKey: ApiKeyInsert): Promise<ApiKey>;
  getApiKey(): Promise<ApiKey | null>;
  updateApiKey(id: string, apiKey: Partial<ApiKeyInsert>): Promise<ApiKey | null>;
}

export class DatabaseStorage implements IStorage {
  async createAgent(agent: AgentInsert): Promise<Agent> {
    const [newAgent] = await db
      .insert(agents)
      .values(agent)
      .returning();
    return newAgent;
  }

  async getAgent(id: string): Promise<Agent | null> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id));
    return agent || null;
  }

  async getAgentBySlug(slug: string): Promise<Agent | null> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.slug, slug));
    return agent || null;
  }

  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents);
  }

  async updateAgent(id: string, agent: Partial<AgentInsert>): Promise<Agent | null> {
    const [updated] = await db
      .update(agents)
      .set(agent)
      .where(eq(agents.id, id))
      .returning();
    return updated || null;
  }

  async deleteAgent(id: string): Promise<boolean> {
    const result = await db
      .delete(agents)
      .where(eq(agents.id, id))
      .returning();
    return result.length > 0;
  }

  async createChatThread(thread: ChatThreadInsert): Promise<ChatThread> {
    const [newThread] = await db
      .insert(chatThreads)
      .values(thread)
      .returning();
    return newThread;
  }

  async getChatThread(id: string): Promise<ChatThread | null> {
    const [thread] = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.id, id));
    return thread || null;
  }

  async getChatThreadBySession(agentSlug: string, sessionId: string): Promise<ChatThread | null> {
    const [thread] = await db
      .select()
      .from(chatThreads)
      .where(and(
        eq(chatThreads.agentSlug, agentSlug),
        eq(chatThreads.sessionId, sessionId)
      ));
    return thread || null;
  }

  async updateChatThread(id: string, thread: Partial<ChatThread>): Promise<ChatThread | null> {
    const [updated] = await db
      .update(chatThreads)
      .set(thread)
      .where(eq(chatThreads.id, id))
      .returning();
    return updated || null;
  }

  async setApiKey(apiKey: ApiKeyInsert): Promise<ApiKey> {
    // Delete existing keys first
    await db.delete(apiKeys);
    
    const [newApiKey] = await db
      .insert(apiKeys)
      .values(apiKey)
      .returning();
    return newApiKey;
  }

  async getApiKey(): Promise<ApiKey | null> {
    const [apiKey] = await db.select().from(apiKeys).limit(1);
    return apiKey || null;
  }

  async updateApiKey(id: string, apiKey: Partial<ApiKeyInsert>): Promise<ApiKey | null> {
    const [updated] = await db
      .update(apiKeys)
      .set(apiKey)
      .where(eq(apiKeys.id, id))
      .returning();
    return updated || null;
  }
}

export const storage = new DatabaseStorage();
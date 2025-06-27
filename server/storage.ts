import { Agent, AgentInsert, ChatThread, ChatThreadInsert, ApiKey, ApiKeyInsert } from "../shared/schema";
import { v4 as uuidv4 } from 'uuid';

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

export class MemStorage implements IStorage {
  private agents: Map<string, Agent> = new Map();
  private chatThreads: Map<string, ChatThread> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();

  async createAgent(agent: AgentInsert): Promise<Agent> {
    const id = uuidv4();
    const newAgent: Agent = {
      ...agent,
      id,
      lastUpdated: new Date().toISOString(),
    };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  async getAgent(id: string): Promise<Agent | null> {
    return this.agents.get(id) || null;
  }

  async getAgentBySlug(slug: string): Promise<Agent | null> {
    for (const agent of this.agents.values()) {
      if (agent.slug === slug) {
        return agent;
      }
    }
    return null;
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async updateAgent(id: string, agent: Partial<AgentInsert>): Promise<Agent | null> {
    const existing = this.agents.get(id);
    if (!existing) return null;
    
    const updated: Agent = {
      ...existing,
      ...agent,
      lastUpdated: new Date().toISOString(),
    };
    this.agents.set(id, updated);
    return updated;
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  async createChatThread(thread: ChatThreadInsert): Promise<ChatThread> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newThread: ChatThread = {
      ...thread,
      id,
      createdAt: now,
      lastMessageAt: now,
    };
    this.chatThreads.set(id, newThread);
    return newThread;
  }

  async getChatThread(id: string): Promise<ChatThread | null> {
    return this.chatThreads.get(id) || null;
  }

  async getChatThreadBySession(agentSlug: string, sessionId: string): Promise<ChatThread | null> {
    for (const thread of this.chatThreads.values()) {
      if (thread.agentSlug === agentSlug && thread.sessionId === sessionId) {
        return thread;
      }
    }
    return null;
  }

  async updateChatThread(id: string, thread: Partial<ChatThread>): Promise<ChatThread | null> {
    const existing = this.chatThreads.get(id);
    if (!existing) return null;
    
    const updated: ChatThread = {
      ...existing,
      ...thread,
      lastMessageAt: new Date().toISOString(),
    };
    this.chatThreads.set(id, updated);
    return updated;
  }

  async setApiKey(apiKey: ApiKeyInsert): Promise<ApiKey> {
    const id = uuidv4();
    const newApiKey: ApiKey = {
      ...apiKey,
      id,
    };
    this.apiKeys.set(id, newApiKey);
    return newApiKey;
  }

  async getApiKey(): Promise<ApiKey | null> {
    const apiKeys = Array.from(this.apiKeys.values());
    return apiKeys.length > 0 ? apiKeys[0] : null;
  }

  async updateApiKey(id: string, apiKey: Partial<ApiKeyInsert>): Promise<ApiKey | null> {
    const existing = this.apiKeys.get(id);
    if (!existing) return null;
    
    const updated: ApiKey = {
      ...existing,
      ...apiKey,
      lastValidated: new Date().toISOString(),
    };
    this.apiKeys.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
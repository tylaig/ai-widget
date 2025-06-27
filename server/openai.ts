import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openaiClient: OpenAI | null = null;

export const getOpenAIClient = async (): Promise<OpenAI | null> => {
  if (openaiClient) return openaiClient;
  
  const apiKey = await storage.getApiKey();
  if (!apiKey || !apiKey.isValid) return null;
  
  openaiClient = new OpenAI({ apiKey: apiKey.openaiApiKey });
  return openaiClient;
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return true;
  } catch (error) {
    return false;
  }
};

export const listAssistants = async (): Promise<any[]> => {
  const client = await getOpenAIClient();
  if (!client) return [];
  
  try {
    const response = await client.beta.assistants.list();
    return response.data || [];
  } catch (error) {
    console.error('Error listing assistants:', error);
    return [];
  }
};

export const createAssistant = async (name: string, instructions: string, model: string = "gpt-4o"): Promise<string | null> => {
  const client = await getOpenAIClient();
  if (!client) return null;
  
  try {
    const response = await client.beta.assistants.create({
      name,
      instructions,
      model,
    });
    return response.id;
  } catch (error) {
    console.error('Error creating assistant:', error);
    return null;
  }
};

export const updateAssistant = async (assistantId: string, name: string, instructions: string): Promise<boolean> => {
  const client = await getOpenAIClient();
  if (!client) return false;
  
  try {
    await client.beta.assistants.update(assistantId, {
      name,
      instructions,
    });
    return true;
  } catch (error) {
    console.error('Error updating assistant:', error);
    return false;
  }
};

export const createThread = async (): Promise<string | null> => {
  const client = await getOpenAIClient();
  if (!client) return null;
  
  try {
    const response = await client.beta.threads.create();
    return response.id;
  } catch (error) {
    console.error('Error creating thread:', error);
    return null;
  }
};

export const sendMessage = async (threadId: string, content: string): Promise<string | null> => {
  const client = await getOpenAIClient();
  if (!client) return null;
  
  try {
    await client.beta.threads.messages.create(threadId, {
      role: "user",
      content,
    });
    return "Message sent";
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

export const runAssistant = async (threadId: string, assistantId: string): Promise<string | null> => {
  const client = await getOpenAIClient();
  if (!client) return null;
  
  try {
    const run = await client.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
    
    // Poll for completion - fixed parameter order
    let runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
    }
    
    if (runStatus.status === 'completed') {
      const messages = await client.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];
      if (lastMessage && lastMessage.content[0] && 'text' in lastMessage.content[0]) {
        return lastMessage.content[0].text.value;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error running assistant:', error);
    return null;
  }
};

export const transcribeAudio = async (audioBuffer: Buffer): Promise<string | null> => {
  const client = await getOpenAIClient();
  if (!client) return null;
  
  try {
    // Create a temporary file-like object for the audio
    const audioFile = new Blob([audioBuffer], { type: "audio/wav" }) as any;
    audioFile.name = "audio.wav";
    
    const response = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });
    return response.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
};
import express from 'express';
import multer from 'multer';
import { storage } from './storage';
import { agentInsertSchema, chatMessageSchema, apiKeyInsertSchema } from '../shared/schema';
import { validateApiKey, listAssistants, createAssistant, updateAssistant, createThread, sendMessage, runAssistant, transcribeAudio } from './openai';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// API Key routes
router.post('/api/api-key', async (req, res) => {
  try {
    const data = apiKeyInsertSchema.parse(req.body);
    const isValid = await validateApiKey(data.openaiApiKey);
    
    const apiKey = await storage.setApiKey({
      ...data,
      isValid,
    });
    
    res.json(apiKey);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});

router.get('/api/api-key', async (req, res) => {
  try {
    const apiKey = await storage.getApiKey();
    res.json(apiKey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get API key' });
  }
});

// Agent routes
router.get('/api/agents', async (req, res) => {
  try {
    const agents = await storage.getAllAgents();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agents' });
  }
});

router.get('/api/agents/:id', async (req, res) => {
  try {
    const agent = await storage.getAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

router.post('/api/agents', async (req, res) => {
  try {
    const data = agentInsertSchema.parse(req.body);
    
    // Check if slug is unique
    const existingAgent = await storage.getAgentBySlug(data.slug);
    if (existingAgent) {
      res.status(400).json({ error: 'Slug already exists' });
      return;
    }
    
    // Create OpenAI assistant if instructions provided
    let openaiAssistantId: string | undefined = undefined;
    if (data.instructions) {
      const assistantId = await createAssistant(data.name, data.instructions, data.model);
      openaiAssistantId = assistantId || undefined;
    }
    
    const agent = await storage.createAgent({
      ...data,
      openaiAssistantId,
    });
    
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});

router.put('/api/agents/:id', async (req, res) => {
  try {
    const data = agentInsertSchema.partial().parse(req.body);
    
    const existingAgent = await storage.getAgent(req.params.id);
    if (!existingAgent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    // Update OpenAI assistant if instructions changed
    if (data.instructions && existingAgent.openaiAssistantId) {
      await updateAssistant(existingAgent.openaiAssistantId, data.name || existingAgent.name, data.instructions);
    }
    
    const agent = await storage.updateAgent(req.params.id, data);
    res.json(agent);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});

router.delete('/api/agents/:id', async (req, res) => {
  try {
    const success = await storage.deleteAgent(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// OpenAI Assistant routes
router.get('/api/openai/assistants', async (req, res) => {
  try {
    const assistants = await listAssistants();
    res.json(assistants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list assistants' });
  }
});

// Chat routes
router.post('/api/chat/message', async (req, res) => {
  try {
    const data = chatMessageSchema.parse(req.body);
    
    // Get or create chat thread
    let thread = await storage.getChatThreadBySession(data.agentSlug, data.sessionId);
    if (!thread) {
      const openaiThreadId = await createThread();
      thread = await storage.createChatThread({
        agentSlug: data.agentSlug,
        sessionId: data.sessionId,
        openaiThreadId: openaiThreadId || undefined,
        messages: [],
      });
    }
    
    // Get agent
    const agent = await storage.getAgentBySlug(data.agentSlug);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    let userMessage = data.content;
    
    // Transcribe audio if provided
    if (data.audioData) {
      const audioBuffer = Buffer.from(data.audioData, 'base64');
      const transcription = await transcribeAudio(audioBuffer);
      if (transcription) {
        userMessage = transcription;
      }
    }
    
    // Add user message to thread
    const userMsg = {
      id: uuidv4(),
      role: 'user' as const,
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    
    thread.messages.push(userMsg);
    
    // Send message to OpenAI and get response
    let assistantResponse = '';
    if (thread.openaiThreadId && agent.openaiAssistantId) {
      await sendMessage(thread.openaiThreadId, userMessage);
      const response = await runAssistant(thread.openaiThreadId, agent.openaiAssistantId);
      assistantResponse = response || 'Desculpe, não consegui processar sua mensagem.';
    } else {
      assistantResponse = 'Agente não configurado corretamente.';
    }
    
    // Add assistant response to thread
    const assistantMsg = {
      id: uuidv4(),
      role: 'assistant' as const,
      content: assistantResponse,
      timestamp: new Date().toISOString(),
    };
    
    thread.messages.push(assistantMsg);
    
    // Update thread in storage
    await storage.updateChatThread(thread.id, { messages: thread.messages });
    
    res.json({
      message: assistantMsg,
      thread: thread,
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

router.get('/api/chat/thread/:agentSlug/:sessionId', async (req, res) => {
  try {
    const thread = await storage.getChatThreadBySession(req.params.agentSlug, req.params.sessionId);
    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chat thread' });
  }
});

// File upload route
router.post('/api/agents/:id/files', upload.array('files'), async (req, res) => {
  try {
    const agent = await storage.getAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    const files = req.files as Express.Multer.File[];
    const fileNames = files.map(file => file.originalname);
    
    // In a real implementation, you would upload these files to OpenAI
    // For now, we'll just store the file names
    const updatedFiles = [...agent.files, ...fileNames];
    
    await storage.updateAgent(req.params.id, { files: updatedFiles });
    
    res.json({ files: fileNames });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Widget HTML generation
router.get('/api/widget/:slug', async (req, res) => {
  const { slug } = req.params;
  const { theme = 'light', enableAudio = 'true', primaryColor = '#007bff' } = req.query;
  
  const agent = await storage.getAgentBySlug(slug);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  
  const widgetHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat Widget</title>
  <style>
    .chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: ${primaryColor};
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      transition: all 0.3s ease;
    }
    
    .chat-widget:hover {
      transform: scale(1.1);
    }
    
    .chat-widget svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    
    .chat-popup {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      z-index: 1001;
      overflow: hidden;
    }
    
    .chat-popup.open {
      display: flex;
    }
    
    .chat-header {
      background: ${primaryColor};
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .chat-header img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
    
    .chat-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f8f9fa;
    }
    
    .chat-input {
      padding: 16px;
      border-top: 1px solid #e9ecef;
      background: white;
      display: flex;
      gap: 8px;
    }
    
    .chat-input input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 20px;
      outline: none;
    }
    
    .chat-input button {
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .message {
      margin-bottom: 12px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    
    .message.user {
      flex-direction: row-reverse;
    }
    
    .message-content {
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 12px;
      background: white;
      word-wrap: break-word;
    }
    
    .message.user .message-content {
      background: ${primaryColor};
      color: white;
    }
    
    .message-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #6c757d;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <div class="chat-widget" onclick="toggleChat()">
    <svg viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  </div>
  
  <div class="chat-popup" id="chatPopup">
    <div class="chat-header">
      <div class="message-avatar">A</div>
      <div>
        <div style="font-weight: bold;">${agent.name}</div>
        <div style="font-size: 12px; opacity: 0.8;">Alguns minutos</div>
      </div>
    </div>
    
    <div class="chat-body" id="chatBody">
      <div class="message">
        <div class="message-avatar">B</div>
        <div class="message-content">
          Olá! Como posso te ajudar hoje?
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <input type="text" id="messageInput" placeholder="Digite sua mensagem..." onkeypress="handleKeyPress(event)">
      <button onclick="sendMessage()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  </div>
  
  <script>
    const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    
    function toggleChat() {
      const popup = document.getElementById('chatPopup');
      popup.classList.toggle('open');
    }
    
    function handleKeyPress(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    }
    
    async function sendMessage() {
      const input = document.getElementById('messageInput');
      const message = input.value.trim();
      if (!message) return;
      
      input.value = '';
      
      // Add user message to chat
      addMessage(message, 'user');
      
      try {
        const response = await fetch('./api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: message,
            agentSlug: '${slug}',
            sessionId: sessionId,
          }),
        });
        
        const data = await response.json();
        
        if (data.message) {
          addMessage(data.message.content, 'assistant');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        addMessage('Desculpe, ocorreu um erro. Tente novamente.', 'assistant');
      }
    }
    
    function addMessage(content, role) {
      const chatBody = document.getElementById('chatBody');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ' + role;
      
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.textContent = role === 'user' ? 'U' : 'B';
      
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.textContent = content;
      
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(messageContent);
      
      chatBody.appendChild(messageDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  </script>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(widgetHtml);
});

export default router;
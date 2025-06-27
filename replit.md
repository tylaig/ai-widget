# AI Agents Platform Documentation

## Overview

A comprehensive AI Agents Platform for managing OpenAI assistants with dashboard, chat widgets, and configuration tools. The platform allows users to create, configure, and embed AI chat widgets similar to Intercom into their websites.

## System Architecture

### Frontend (React + TypeScript)
- Built with Vite for fast development
- Uses Wouter for client-side routing
- Styled with Tailwind CSS and Radix UI components
- TanStack Query for API state management
- Three main pages: Dashboard, Agent Editor, Widget Configuration

### Backend (Express + TypeScript)
- RESTful API built with Express
- In-memory storage for data persistence
- OpenAI API integration for assistant management
- Multer for file upload handling
- Auto-generated chat widgets with HTML/CSS/JS

### Key Features
1. **Dashboard**: API key configuration, agent listing, status monitoring
2. **Agent Editor**: Create/edit agents, file uploads, OpenAI assistant integration
3. **Widget Generator**: Customizable chat widgets with Intercom-like interface
4. **Chat System**: Real-time messaging with OpenAI assistants
5. **Audio Support**: Voice message transcription via Whisper API

## Key Components

### Backend Components
- `server/storage.ts` - In-memory data storage interface
- `server/openai.ts` - OpenAI API integration layer
- `server/routes.ts` - API endpoints for all functionality
- `server/index.ts` - Express server configuration

### Frontend Components
- `client/src/pages/Dashboard.tsx` - Main dashboard interface
- `client/src/pages/AgentEditor.tsx` - Agent creation and editing
- `client/src/pages/WidgetConfig.tsx` - Widget customization and code generation
- `client/src/components/ui/*` - Reusable UI components based on Radix
- `client/src/lib/queryClient.ts` - API client configuration

### Data Models
- `Agent` - AI agent configuration with OpenAI assistant mapping
- `ChatThread` - Conversation threads with session management
- `ApiKey` - OpenAI API key storage and validation
- `WidgetConfig` - Chat widget appearance and behavior settings

## Data Flow

1. **Agent Creation**: Dashboard → Agent Editor → OpenAI Assistant Creation → Storage
2. **Widget Generation**: Agent → Widget Config → HTML/CSS/JS Code Generation
3. **Chat Flow**: Widget → API → OpenAI Assistant → Response → Widget
4. **File Processing**: Upload → Storage → OpenAI Vector Store (planned)

## External Dependencies

### Required Services
- OpenAI API (GPT-4o, Whisper, Assistants API)

### Key Libraries
- **Frontend**: React, Wouter, TanStack Query, Tailwind CSS, Radix UI
- **Backend**: Express, OpenAI SDK, Multer, UUID
- **Shared**: Zod for schema validation

## Deployment Strategy

Ready for Replit Deployments with automatic build process. The platform serves both API and frontend from a single Express server.

## Recent Changes

### June 27, 2025 - Complete Platform Implementation
- Created comprehensive AI agents platform with all requested features
- Implemented dashboard with OpenAI API key management
- Built agent editor with file upload and OpenAI assistant integration
- Developed widget configuration system with Intercom-style chat interface
- Added real-time chat functionality with audio transcription
- Created embeddable HTML widgets with customizable themes and colors
- Implemented slug-based agent routing for widget deployment
- Added responsive design with dark/light theme support

## User Preferences

Preferred communication style: Simple, everyday language.
Project focus: Build comprehensive AI platform with professional UI similar to Intercom.

---

*Platform successfully implements all specified requirements including dashboard, agent management, widget generation, and chat functionality.*
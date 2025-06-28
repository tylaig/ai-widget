CREATE TABLE "agents" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"model" varchar(64) NOT NULL,
	"openai_assistant_id" varchar(128),
	"slug" varchar(128) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_updated" varchar(64) NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"instructions" text
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"openai_api_key" varchar(128) NOT NULL,
	"is_valid" boolean DEFAULT false NOT NULL,
	"last_validated" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"agent_slug" varchar(128) NOT NULL,
	"session_id" varchar(128) NOT NULL,
	"openai_thread_id" varchar(128),
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" varchar(64) NOT NULL,
	"last_message_at" varchar(64) NOT NULL
);

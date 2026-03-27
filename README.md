# Axon

A constitution-driven AI agent built with Auth0 for AI Agents Token Vault.

## What it does

Axon is an AI productivity agent that manages Gmail, Google Calendar, Google Drive, and GitHub through delegated access powered by Auth0 Token Vault.

What makes Axon different:

1. **Token Vault** — OAuth tokens stored and managed by Auth0. The application never stores third-party credentials.
2. **Constitution rules** — Users define plain-English behavioral rules enforced at runtime before any tool executes.
3. **Risk classification** — Every action classified into five tiers: observe, draft, act, transact, admin.
4. **Approval queue** — Act-tier and higher actions create approval requests. Users approve or reject before execution.
5. **Operating modes** — Shadow (observe only), Assist (approvals required), Autopilot (routine actions auto-execute).
6. **Full audit trail** — Every action logged with service, risk tier, scopes, rules applied, and outcome.
7. **Multi-session chat** — Multiple chat sessions with history persistence.
8. **Voice input** — Speech-to-text input using browser Speech Recognition API.
9. **Markdown rendering** — AI responses rendered with proper formatting.

## Services

- **Gmail** — Read, draft, send emails
- **Google Calendar** — List and create events
- **Google Drive** — List and search files
- **GitHub** — List repos, issues, PRs, notifications. Create issues and comments.

## Tech stack

- Next.js 16
- Auth0 (login + Token Vault)
- Supabase (PostgreSQL)
- Gemini 2.0 Flash (primary AI)
- OpenRouter (secondary, multiple model fallback)
- Groq / Llama 3.3 70B (tertiary)
- Vercel (deployment)

## Security model

- Users authenticate with GitHub or Google via Auth0
- External services connected through Auth0 Token Vault Connected Accounts
- GitHub uses GitHub App with expiring user tokens for refresh token support
- Actions classified by risk tier before execution
- Constitution rules enforced in application code, not just in prompts
- High-risk actions routed to approval queue
- All actions logged with full context

## Production

https://axonagent.vercel.app

## Local development

Create `.env.local`:

```env
AUTH0_SECRET=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GOOGLE_AI_API_KEY=
OPENROUTER_API_KEY=
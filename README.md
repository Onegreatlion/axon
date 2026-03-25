# Axon

A constitution-driven AI agent built with Auth0 for AI Agents Token Vault.

## What it does

Axon is an AI productivity agent that manages Gmail and Google Calendar through delegated access powered by Auth0 Token Vault.

What makes Axon different from a standard AI assistant is how it handles authorization:

1. **Token Vault for credential management** - Google OAuth tokens are stored and managed by Auth0 Token Vault. The application never stores third-party credentials directly.

2. **Constitution rules** - Users define plain-English behavioral rules that are enforced at runtime before any tool executes. Not just prompt instructions. Structural enforcement.

3. **Risk-based intent classification** - Every action is classified into one of five risk tiers: observe, draft, act, transact, admin. Classification determines whether an action executes automatically, requires approval, or is blocked.

4. **Approval queue** - Act-tier and higher actions create approval requests visible on a dedicated page. Users approve or reject each one before execution.

5. **Operating modes** - Shadow (observe only), Assist (writes require approval), Autopilot (routine writes auto-execute). Mode is enforced at the tool execution layer.

6. **Full audit trail** - Every action is logged with service, risk tier, scopes used, constitution rules applied, and outcome.

## How it works

- Users authenticate with GitHub or Google through Auth0
- Google services are connected through Auth0 Token Vault Connected Accounts
- The AI agent (Groq / Llama 3.3 70B) uses tool calling to interact with Gmail and Calendar
- Before any tool executes, the system checks: the current operating mode, constitution rules, and risk classification
- High-risk actions are routed to the approval queue
- All actions are logged with full context

## Tech stack

- **Frontend**: Next.js 16
- **Authentication**: Auth0
- **Token management**: Auth0 Token Vault
- **Database**: Supabase (PostgreSQL)
- **AI model**: Groq / Llama 3.3 70B
- **Deployment**: Vercel

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
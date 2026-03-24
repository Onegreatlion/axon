# Axon

Axon is a constitution-driven AI agent built with Auth0 for AI Agents Token Vault.

## What it is

Axon is not just an AI productivity assistant. It is a demonstration of how AI agents should operate when acting on behalf of real users with real data.

The core idea: users define behavioral rules in plain English. Those rules are enforced at runtime, not just injected into a prompt. Every action is classified by risk, checked against the user's constitution, and either executed, queued for approval, or blocked.

## Why this matters

Most AI agents today have two major problems:

1. They receive more access than any single task requires
2. Users cannot see or control what the agent does on their behalf

Axon addresses both directly.

## How it works

### 1. Delegated access through Auth0 Token Vault
Google credentials are managed by Auth0 Token Vault. The application never stores raw third-party tokens. Access is retrieved on demand, per action.

### 2. Constitution rules
Users write plain-English rules in the Constitution editor. These rules are parsed and enforced at the tool execution layer before any action runs. Not just in the prompt.

Example rule:
This rule causes all send_email tool calls to be routed to the Approvals queue instead of executing directly.

### 3. Risk-based intent classification
Every tool call is classified into one of five risk tiers:

| Tier | Examples | Behavior |
|------|----------|----------|
| Observe | Read inbox, check calendar | Auto-approved |
| Draft | Create email draft | Auto-approved |
| Act | Send email, create event | Queued for approval |
| Transact | Irreversible operations | Step-up required |
| Admin | Permission changes | Manual only |

### 4. Approval queue
Act-tier and higher actions create approval requests visible in the Approvals page. Users can approve or reject each one. Approved actions execute immediately. Rejected actions are logged as denied.

### 5. Full action logs
Every action is logged with:
- service
- action type
- risk tier
- scopes used
- constitution rules applied
- status
- reasoning

### 6. Operating modes
Users can switch between:
- **Shadow**: observe only, no write actions
- **Assist**: write actions require approval
- **Autopilot**: routine actions execute automatically

Mode changes take effect immediately.

## Tech stack

- Next.js 16
- Auth0 (login + Token Vault)
- Supabase (database)
- Groq / Llama 3.3 70B (agent reasoning)
- Vercel (deployment)

## Production

https://axonagent.vercel.app

## Setup

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

npm install
npm run dev

user_profiles, constitution_rules, action_logs, connected_services, approval_requests


---

# 4. Devpost submission text

Use this as your full Devpost description.

```md
## Axon

Axon is a constitution-driven AI agent built with Auth0 for AI Agents Token Vault.

### The problem

AI agents are becoming more capable, but two fundamental problems remain:

1. They receive more OAuth access than any single task requires
2. Users have no way to see or control what agents do on their behalf

Most solutions address the first problem with static scope selection at connect time. Nobody has addressed the second problem at a system level.

### What Axon does

Axon introduces a constitution layer between the user and the agent. Users define behavioral rules in plain English. Those rules are enforced at runtime, at the tool execution layer, before any action reaches an external service.

This is not prompt injection. The rules are stored in a database and checked in code before tool calls execute.

### Core components

**1. Token Vault integration**
Google is connected through Auth0 Token Vault. Third-party OAuth tokens are never stored in the application. Access is retrieved on demand, per action, through the Token Vault exchange.

**2. Constitution rules**
Users write rules like:
- Never send emails without my approval
- Always ask before creating calendar events

These rules are parsed and enforced before any write action executes. Violations are not just logged. They are blocked and converted into approval requests.

**3. Risk-based intent classification**
Every tool call is classified into one of five risk tiers: observe, draft, act, transact, admin. Classification determines whether an action executes automatically, requires approval, or is blocked entirely.

**4. Approval queue**
Act-tier actions (send email, create event) generate approval requests that appear on a dedicated Approvals page. Users can approve or reject each one. Approved actions execute and log to the audit trail. Rejected actions are logged as denied.

**5. Operating modes**
Users choose between Shadow (observe only), Assist (approvals required for writes), and Autopilot (automatic execution of routine actions). Mode is persisted in the database and enforced at runtime.

**6. Full audit trail**
Every action logs service, action type, risk tier, scopes used, constitution rules applied, reasoning, and outcome.

### Why this matters

Axon demonstrates a practical pattern for how AI agents should operate: delegated access through Token Vault, user-defined behavioral constraints enforced at the execution layer, and full transparency over what the agent did and why.

This pattern is generalizable. Any agent system could adopt constitution-based rule enforcement and risk-tier classification. The pattern is not specific to Gmail or Calendar.

### Tech stack
- Next.js 16
- Auth0 Token Vault
- Supabase
- Groq / Llama 3.3 70B
- Vercel

### Links
- Production: https://axonagent.vercel.app
- Repository: https://github.com/Onegreatlion/axon

---

## Bonus Blog Post

Building Axon taught me that the hardest part of AI agents is not intelligence. It is authority.

When I started this project, my first instinct was to build a capable assistant. The more I built, the more I realized capability without control is the wrong goal. An agent that can send emails, create events, and read your inbox has significant power. The question is not whether it can do those things. The question is whether you, as the user, can actually control when and how.

The standard approach is OAuth scopes. Connect your Google account, grant the necessary permissions, done. But scopes answer the question "what can this application do?" They do not answer "what should this agent do right now, based on my preferences, for this specific action?" Those are very different questions.

That gap is where the constitution idea came from. If you let users write plain-English rules like "never send emails without my approval," you are giving them a human-scale control model. Most people cannot reason about OAuth scopes. Everyone can reason about rules written in their own words.

The challenge was making those rules real. It is easy to inject them into a prompt and hope the model obeys. The stronger approach is to enforce them in code, before the tool executes. In Axon, the rule check happens at the tool execution layer. If a rule blocks an action, the action is converted to an approval request regardless of what the model wanted to do. The model cannot override a rule check that happens outside the model.

Auth0 Token Vault was the right foundation for this. By keeping third-party credentials outside the application, the security boundary is clearer. The application does not need to be the secret store. It just needs to retrieve a token when it has a legitimate, scoped reason to. That changes how you think about agent design.

The approval queue was the feature that made the control model feel real. Instead of trust being a static decision made at connect time, it becomes a continuous negotiation. Every act-tier action asks for your approval. You build trust with the agent by seeing what it asks for and deciding how much latitude to give it.

If I were to continue this work, I would push further on three areas: stronger rule parsing that maps natural language to specific action types and service boundaries, step-up authentication for transact-tier actions, and workflow automation that lets users define recurring approval patterns. The foundation is solid. The pattern is extensible.

The main lesson is this: agent authorization should not be a one-time consent. It should be continuous, visible, and shaped by the user over time. Token Vault makes the credential layer safe. Constitution rules make the behavioral layer understandable. Together, they are a better model for how agents should earn and maintain trust.
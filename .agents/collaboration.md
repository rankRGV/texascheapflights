# Agent Collaboration Rules

To ensure seamless handoffs between different AI models (Gemini, Claude, OpenAI, etc.) and avoid redundant work, we follow these rules:

## 1. Completed Task Signatures
Whenever a task or sub-task is marked as completed in `task.md` (or similar tracking files), the agent who performed the work must append their name or initials.

**Format:**
`- [x] Task description - [Agent Name]`

**Example:**
`- [x] Set up database schema - Antigravity`

## 2. Walkthrough Attribution
Every `walkthrough.md` or major update report should include a footer indicating which agent provided the work.

**Format:**
`---`
`*Completed by: [Agent Name]*`

## 3. Persistent Knowledge
Agents should check for these signatures before starting work on any task that appears to be in progress or completed to ensure we are building upon each other's work rather than repeating it.

---

## 4. Quota / Model Switching

When a model hits its quota or credit limit mid-task, switch models using the **in-IDE model dropdown** (no logout required). Available fallbacks in Antigravity IDE:

- **Claude Sonnet 4.6** (Thinking)
- **Claude Opus 4.6** (Thinking)
- **GPT-OSS 120B**

The incoming model MUST do the following before continuing:

1. Read `.agents/collaboration.md` — rules
2. Read `.agents/product-marketing-context.md` — product knowledge
3. Read the most recent `task.md` — find the last signed `[x]` item
4. Resume from the first `[ ]` item and state: *"Picking up from [last task]. Next step is [next task]."*

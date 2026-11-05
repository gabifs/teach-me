# PROTOTYPE, throwaway: Mastra stream to OpenUI Lesson

Answers: does a Mastra stream render as an OpenUI Lesson, with quiz answers returning to the Teacher?
Verdict: yes, keep OpenUI Lang. Never merged; see the ticket for the full answer.

- `pnpm install`, then `pnpm start` (real model, paste an OpenAI key in the page) or `pnpm mock` (canned model, no key).
- Open http://localhost:5199. Right panel shows events, OpenUI errors, Teacher history and stored Lessons.
- State is in memory. Plain `node:http`, no Nest, web search or Postgres.
- `evidence/` holds three Lessons from `gpt-6.1-terra`, the Teacher history and two screenshots.

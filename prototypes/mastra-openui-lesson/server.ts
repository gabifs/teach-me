// PROTOTYPE, throwaway. Plain node http instead of Nest (Nest + fullStream was verified by the Mastra-in-NestJS research ticket).
// State lives in memory: restart wipes it.
import { createServer, type ServerResponse } from "node:http";
import { Agent } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";
import { createTool } from "@mastra/core/tools";
import { z } from "zod/v4";
import { library } from "./src/library";
import { mockModel } from "./mock-model";

const MOCK = !!process.env.MOCK_LLM;
const MODEL = process.env.MODEL ?? "gpt-6.1-terra";

type Lesson = { id: string; number: number; title: string; text: string; state: Record<string, unknown>; usage?: unknown; ms?: { firstDelta: number; total: number } };
type Item = { kind: "text"; role: "learner" | "teacher"; text: string } | { kind: "lesson"; lessonId: string } | { kind: "quiz"; text: string };
const db = { items: [] as Item[], lessons: [] as Lesson[], teacherHistory: [] as { role: "user" | "assistant"; content: string }[] };

const model = (name: "teacher" | "writer") => ({ requestContext }: { requestContext: RequestContext }) => {
  if (MOCK) return mockModel(name);
  const apiKey = requestContext.get("openaiKey") as string | undefined;
  if (!apiKey) throw new Error("NO_LEARNER_KEY");
  return { id: `openai/${MODEL}` as const, apiKey };
};

const lessonPrompt = library.prompt({
  preamble: "You write one Lesson for a learner: short, self-contained, on a single tightly-scoped thing, giving one tangible win. Output OpenUI Lang only, no markdown fences.",
  additionalRules: [
    "Write the root statement first so the Lesson appears as it streams.",
    "End with at least one Quiz. Keep every option of a Quiz about the same length, and vary which position is correct.",
  ],
  examples: [`root = Lesson("Title", [p1, q1])\np1 = Prose("First paragraph.\\n\\nSecond paragraph.")\nq1 = Quiz("q1", "Question?", ["Option one", "Option two"], 1, "Why option two is right.")`],
});

const writer = new Agent({ id: "lesson-writer", name: "Lesson Writer", instructions: lessonPrompt, model: model("writer") as never });

const createLesson = createTool({
  id: "create_lesson",
  description: "Create and show the learner a new numbered Lesson. Give a title and a brief for the writer. Do not repeat the Lesson's content afterwards.",
  inputSchema: z.object({ title: z.string(), brief: z.string() }),
  execute: async ({ title, brief }, ctx) => {
    const emit = ctx.requestContext!.get("emit") as (event: string, data: unknown) => void;
    const lesson: Lesson = { id: crypto.randomUUID(), number: db.lessons.length + 1, title, text: "", state: {} };
    db.lessons.push(lesson);
    db.items.push({ kind: "lesson", lessonId: lesson.id });
    emit("lesson-start", { id: lesson.id, number: lesson.number, title });
    const started = Date.now();
    let firstDelta = 0;
    const out = await writer.stream(`Title: ${title}\nBrief: ${brief}`, { requestContext: ctx.requestContext });
    for await (const chunk of out.textStream) {
      firstDelta ||= Date.now() - started;
      lesson.text += chunk;
      emit("lesson-delta", { id: lesson.id, chunk });
    }
    lesson.usage = await out.usage;
    lesson.ms = { firstDelta, total: Date.now() - started };
    emit("lesson-end", { id: lesson.id, usage: lesson.usage, ms: lesson.ms });
    // The body never goes back to the Teacher: this result is all it sees.
    return { lessonId: lesson.id, number: lesson.number, title, shown: true };
  },
});

const teacher = new Agent({
  id: "teacher",
  name: "Teacher",
  instructions: `You are the Teacher. Reply in short markdown. When the learner should be taught something, call create_lesson (never write a Lesson in chat), then say one line inviting them to try its quiz. When you get a [quiz answer] message, respond to what it shows about their understanding, in two sentences at most.`,
  model: model("teacher") as never,
  tools: { create_lesson: createLesson },
});

function sse(res: ServerResponse) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
  return (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function runTeacher(content: string, key: string | undefined, res: ServerResponse) {
  const emit = sse(res);
  db.teacherHistory.push({ role: "user", content });
  try {
    const requestContext = new RequestContext();
    requestContext.set("emit", emit);
    if (key) requestContext.set("openaiKey", key);
    const out = await teacher.stream(db.teacherHistory as never, { requestContext, maxSteps: 3 });
    let text = "";
    const made: string[] = [];
    for await (const c of out.fullStream as AsyncIterable<any>) {
      if (c.type === "text-delta") { text += c.payload.text; emit("delta", c.payload.text); }
      if (c.type === "tool-result") { made.push(`(Created Lesson ${c.payload.result?.number}: ${c.payload.result?.title})`); }
      if (c.type === "error") emit("error", String(c.payload?.error?.message ?? c.payload?.error ?? "error"));
    }
    if (text) db.items.push({ kind: "text", role: "teacher", text });
    db.teacherHistory.push({ role: "assistant", content: [...made, text].filter(Boolean).join("\n") });
    emit("usage", await out.usage);
  } catch (e) {
    emit("error", (e as Error).message);
  }
  res.end();
}

const body = (req: import("node:http").IncomingMessage) => new Promise<any>((ok) => { let s = ""; req.on("data", (d) => (s += d)); req.on("end", () => ok(s ? JSON.parse(s) : {})); });
const json = (res: ServerResponse, data: unknown) => { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };

createServer(async (req, res) => {
  const key = req.headers["x-openai-key"] as string | undefined;
  if (req.method === "GET" && req.url === "/api/state") return json(res, { ...db, mock: MOCK, model: MOCK ? "mock" : MODEL });
  if (req.method === "POST" && req.url === "/api/chat") {
    const { message } = await body(req);
    db.items.push({ kind: "text", role: "learner", text: message });
    return runTeacher(message, key, res);
  }
  if (req.method === "POST" && req.url === "/api/quiz-answer") {
    const { lessonId, params } = await body(req);
    const n = db.lessons.find((l) => l.id === lessonId)?.number;
    db.items.push({ kind: "quiz", text: `${params.chosen} (${params.isCorrect ? "correct" : "wrong"})` });
    return runTeacher(`[quiz answer] Lesson ${n}, ${params.quizId}. Question: ${params.question} Learner chose: ${params.chosen}. Correct answer: ${params.correct}. ${params.isCorrect ? "Right." : "Wrong."}`, key, res);
  }
  const m = req.url?.match(/^\/api\/lessons\/([^/]+)\/state$/);
  if (req.method === "POST" && m) {
    const l = db.lessons.find((x) => x.id === m[1]);
    if (l) l.state = await body(req);
    return json(res, { ok: true });
  }
  res.writeHead(404).end();
}).listen(8799, () => console.log(`api on 8799, ${MOCK ? "MOCK LLM" : "model " + MODEL}`));

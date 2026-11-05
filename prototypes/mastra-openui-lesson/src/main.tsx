// PROTOTYPE, throwaway UI: chat + embedded Lessons + debug panel. Visual direction belongs to the Astryx ticket.
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Renderer, type OpenUIError } from "@openuidev/react-lang";
import { library } from "./library";

type Lesson = { id: string; number: number; title: string; text: string; state: Record<string, unknown>; usage?: unknown; ms?: unknown };
type Item = { kind: "text"; role: "learner" | "teacher"; text: string } | { kind: "lesson"; lessonId: string } | { kind: "quiz"; text: string };
type Server = { items: Item[]; lessons: Lesson[]; teacherHistory: unknown[]; mock: boolean; model: string };

function LessonView({ lesson, streaming, onQuiz, onErrors }: { lesson: Lesson; streaming: boolean; onQuiz: (id: string, params: any) => void; onErrors: (e: OpenUIError[]) => void }) {
  const [gen, setGen] = useState(0);
  const [stored, setStored] = useState<Lesson | null>(null);
  const shown = stored ?? lesson;
  return (
    <div className="lesson-wrap">
      <div className="lesson-tag">Lesson {lesson.number} {streaming ? "· streaming" : ""}
        {!streaming && <button className="link" onClick={async () => {
          const s: Server = await (await fetch("/api/state")).json();
          setStored(s.lessons.find((l) => l.id === lesson.id)!); setGen((g) => g + 1);
        }}>re-render from stored (gen {gen})</button>}
      </div>
      <Renderer
        key={gen}
        response={shown.text}
        library={library}
        isStreaming={streaming}
        initialState={shown.state}
        onError={onErrors}
        onStateUpdate={(state) => { fetch(`/api/lessons/${lesson.id}/state`, { method: "POST", body: JSON.stringify(state) }); }}
        onAction={(e) => { if (e.type === "quiz_answer") onQuiz(lesson.id, e.params); }}
      />
    </div>
  );
}

function App() {
  const [server, setServer] = useState<Server | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [teacherDraft, setTeacherDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(sessionStorage.getItem("proto-key") ?? "");
  const [log, setLog] = useState<string[]>([]);
  const [errors, setErrors] = useState<OpenUIError[]>([]);
  const bottom = useRef<HTMLDivElement>(null);
  const note = (s: string) => setLog((l) => [...l.slice(-30), s]);

  const refresh = async () => {
    const s: Server = await (await fetch("/api/state")).json();
    setServer(s); setItems(s.items); setLessons(s.lessons);
  };
  useEffect(() => { refresh(); }, []);
  useEffect(() => { sessionStorage.setItem("proto-key", key); }, [key]);
  useEffect(() => { bottom.current?.scrollIntoView(); }, [items, teacherDraft]);

  const stream = async (url: string, payload: unknown) => {
    setBusy(true); setTeacherDraft("");
    const res = await fetch(url, { method: "POST", headers: { "x-openai-key": key }, body: JSON.stringify(payload) });
    const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const block = buf.slice(0, i); buf = buf.slice(i + 2);
        const event = block.match(/^event: (.*)$/m)?.[1];
        const data = JSON.parse(block.match(/^data: (.*)$/m)?.[1] ?? "null");
        if (event === "delta") setTeacherDraft((t) => t + data);
        else if (event === "lesson-start") {
          setLessons((l) => [...l, { ...data, text: "", state: {} }]);
          setItems((x) => [...x, { kind: "lesson", lessonId: data.id }]);
          setStreamingId(data.id); note(`lesson-start #${data.number}`);
        } else if (event === "lesson-delta") setLessons((l) => l.map((x) => x.id === data.id ? { ...x, text: x.text + data.chunk } : x));
        else if (event === "lesson-end") { setStreamingId(null); note(`lesson-end usage=${JSON.stringify(data.usage)} ms=${JSON.stringify(data.ms)}`); }
        else if (event === "usage") note(`teacher usage=${JSON.stringify(data)}`);
        else if (event === "error") note(`ERROR ${data}`);
      }
    }
    setBusy(false); setTeacherDraft(""); setStreamingId(null);
    await refresh();
  };

  const send = () => {
    if (!draft.trim()) return;
    setItems((x) => [...x, { kind: "text", role: "learner", text: draft }]);
    const message = draft; setDraft("");
    stream("/api/chat", { message });
  };
  const onQuiz = (lessonId: string, params: any) => {
    note(`quiz_answer ${JSON.stringify(params)}`);
    setItems((x) => [...x, { kind: "quiz", text: `${params.chosen} (${params.isCorrect ? "correct" : "wrong"})` }]);
    stream("/api/quiz-answer", { lessonId, params });
  };

  return (
    <div className="app">
      <main>
        <header>
          <b>PROTOTYPE</b> model: {server?.model}
          {!server?.mock && <input type="password" placeholder="OpenAI key (kept in this tab)" value={key} onChange={(e) => setKey(e.target.value)} />}
        </header>
        <div className="chat">
          {items.map((it, i) => {
            if (it.kind === "text") return <div key={i} className={`msg ${it.role}`}>{it.text}</div>;
            if (it.kind === "quiz") return <div key={i} className="msg quiz-note">Quiz answer: {it.text}</div>;
            const l = lessons.find((x) => x.id === it.lessonId);
            return l ? <LessonView key={l.id} lesson={l} streaming={streamingId === l.id} onQuiz={onQuiz} onErrors={setErrors} /> : null;
          })}
          {teacherDraft && <div className="msg teacher">{teacherDraft}</div>}
          <div ref={bottom} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Teach me why the sky is blue" disabled={busy} />
          <button disabled={busy}>Send</button>
        </form>
      </main>
      <aside className="debug">
        <h4>Events</h4><pre>{log.join("\n")}</pre>
        <h4>OpenUI errors</h4><pre>{JSON.stringify(errors, null, 1)}</pre>
        <h4>What the Teacher sees (no Lesson bodies)</h4><pre>{JSON.stringify(server?.teacherHistory, null, 1)}</pre>
        <h4>Stored Lessons</h4><pre>{JSON.stringify(lessons, null, 1)}</pre>
      </aside>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

// PROTOTYPE, throwaway. Three variants of chat + Lesson, switchable via ?variant=A|B|C and ?theme=.
// The bar stays on in production builds on purpose: the Capacitor app runs a production bundle.
import "./style.css";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { stoneTheme } from "@astryxdesign/theme-stone/built";
import { gothicTheme } from "@astryxdesign/theme-gothic/built";
import { LESSON_BLOCKS } from "./parts";
import { VariantA, VariantB, VariantC, type VariantProps } from "./variants";
import { initialMessages, quiz, replies, type Msg } from "./mock";

const variants = { A: ["Inline in chat", VariantA], B: ["Card opens reader", VariantB], C: ["Lesson owns page", VariantC] } as const;
const themes = { neutral: neutralTheme, stone: stoneTheme, gothic: gothicTheme };
const modes = ["light", "dark"] as const;
type V = keyof typeof variants; type T = keyof typeof themes; type M = (typeof modes)[number];
const cycle = <X,>(xs: readonly X[], x: X, d: number) => xs[(xs.indexOf(x) + d + xs.length) % xs.length];
const param = (k: string) => new URLSearchParams(location.search).get(k);

function App() {
  const [v, setV] = useState<V>((param("variant") as V) in variants ? (param("variant") as V) : "A");
  const [t, setT] = useState<T>((param("theme") as T) in themes ? (param("theme") as T) : "neutral");
  const [m, setM] = useState<M>(param("mode") === "dark" ? "dark" : "light");
  const [msgs, setMsgs] = useState<Msg[]>(initialMessages);
  const [visible, setVisible] = useState(LESSON_BLOCKS);
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    const u = new URL(location.href);
    u.searchParams.set("variant", v); u.searchParams.set("theme", t); u.searchParams.set("mode", m);
    history.replaceState(null, "", u);
    document.documentElement.dataset.astryxTheme = t;
  }, [v, t, m]);

  const step = useCallback((d: number) => setV((x) => cycle(Object.keys(variants) as V[], x, d)), []);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input,textarea,[contenteditable]")) return;
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    addEventListener("keydown", f); return () => removeEventListener("keydown", f);
  }, [step]);

  const stream = () => {
    setChosen(null); setVisible(0);
    let n = 0;
    const id = setInterval(() => { n += 1; setVisible(n); if (n >= LESSON_BLOCKS) clearInterval(id); }, 900);
  };
  const say = (from: "teacher" | "learner", text: string, tokens?: number) =>
    setMsgs((x) => [...x, { id: crypto.randomUUID(), from, text, tokens }]);
  const props: VariantProps = {
    msgs, visible, chosen,
    onAnswer: (i) => {
      setChosen(i);
      say("learner", `[quiz answer] ${quiz.options[i]}`);
      setTimeout(() => say("teacher", replies(i === quiz.correct), 1391), 700);
    },
    onSend: (text) => { say("learner", text); setTimeout(() => say("teacher", "Mock reply. No model is wired up in this prototype.", 1402), 500); },
  };
  const [label, Variant] = variants[v];
  return (
    <Theme theme={themes[t]} mode={m}>
      <Variant {...props} />
      <div className="switcher">
        <button onClick={() => step(-1)}>←</button><span>{v}: {label}</span><button onClick={() => step(1)}>→</button>
        <button onClick={() => setT(cycle(Object.keys(themes) as T[], t, 1))}>{t}</button>
        <button onClick={() => setM(cycle(modes, m, 1))}>{m}</button>
        <button onClick={stream}>stream</button>
      </div>
    </Theme>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

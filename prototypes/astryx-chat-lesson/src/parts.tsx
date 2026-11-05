// PROTOTYPE, throwaway. Shared Lesson body and chat pieces; each variant owns its layout.
import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Citation } from "@astryxdesign/core/Citation";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Markdown } from "@astryxdesign/core/Markdown";
import { Banner } from "@astryxdesign/core/Banner";
import { ChatMessage, ChatMessageBubble, ChatMessageMetadata } from "@astryxdesign/core/Chat";
import { lesson, mission, quiz, sources, type Msg } from "./mock";

export const LESSON_BLOCKS = 6;

export function LessonBody({ visible, chosen, onAnswer }: { visible: number; chosen: number | null; onAnswer: (i: number) => void }) {
  const [draft, setDraft] = useState<string>("");
  const blocks = [
    <p key="1">You stop because your hand tries to rebuild the whole chord. It doesn't need to. Em7 and G share three of their four fingers, so the change is one finger's trip.
      <span className="sidenote-mark">1</span>
      <span className="sidenote"><span className="sidenote-mark">1</span> Fingering: Em7 is 022033 and G is 320033, with ring and pinky on fret 3.</span></p>,
    <pre key="2" className="tab">{"       E A D G B e\nEm7    0 2 2 0 3 3\nG      3 2 0 0 3 3"}</pre>,
    <p key="3">Keep index, ring and pinky down. Lift only the middle finger, and move it from the D string to the low E string. Do it ten times with no strumming, looking at nothing but that finger.</p>,
    <p key="4">Then time it. Change back and forth for one minute and count the changes.
      <span className="sidenote-mark">2</span>
      <span className="sidenote"><span className="sidenote-mark">2</span> <Citation number={1} source={sources[0]} /> The one-minute count gives you a number to beat, which is more honest than how it feels.</span>
      {" "}Thirty is a fine first score.</p>,
    <div key="5" className="quiz">
      <RadioList label={quiz.question} value={chosen === null ? draft : String(chosen)} onChange={setDraft} isDisabled={chosen !== null}>
        {quiz.options.map((o, i) => <RadioListItem key={o} value={String(i)} label={o} />)}
      </RadioList>
      {chosen === null
        ? <div className="mt-3"><Button label="Check answer" variant="primary" isDisabled={draft === ""} onClick={() => onAnswer(Number(draft))} /></div>
        : <div className="mt-3"><Banner status={chosen === quiz.correct ? "success" : "warning"} title={chosen === quiz.correct ? "Correct" : "Not quite"} description={quiz.explanation} /></div>}
    </div>,
    <div key="6" className="mt-6 flex flex-wrap gap-2 items-center">
      <span className="lesson-eyebrow">Practise with</span> <Citation number={2} source={sources[1]} />
    </div>,
  ];
  return (
    <article className="lesson">
      <div className="lesson-eyebrow">Lesson {lesson.number} · {lesson.minutes} min</div>
      <h2>{lesson.title}</h2>
      <div className="lesson-col">{blocks.slice(0, visible).map((b, i) => <div className="fade" key={i}>{b}</div>)}</div>
    </article>
  );
}

export function TextMessage({ m }: { m: Extract<Msg, { text: string }> }) {
  if (m.from === "learner") return <ChatMessage sender="user"><ChatMessageBubble>{m.text}</ChatMessageBubble></ChatMessage>;
  return (
    <ChatMessage sender="assistant" name="Teacher" metadata={m.tokens ? <ChatMessageMetadata>{m.tokens.toLocaleString()} tokens</ChatMessageMetadata> : undefined}>
      <ChatMessageBubble variant="ghost"><Markdown density="compact">{m.text}</Markdown></ChatMessageBubble>
    </ChatMessage>
  );
}

export function MissionBar({ end }: { end?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface shrink-0">
      <div className="min-w-0 flex-1">
        <div className="text-secondary text-xs">Mission</div>
        <div className="text-primary text-sm font-medium truncate">{mission}</div>
      </div>
      {end}
    </header>
  );
}

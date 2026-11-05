// PROTOTYPE, throwaway. Three answers to "how does a Lesson open from the chat?"
import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Drawer, DrawerHeader } from "@astryxdesign/core/Drawer";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Spinner } from "@astryxdesign/core/Spinner";
import { ChatComposer, ChatLayout, ChatMessageList } from "@astryxdesign/core/Chat";
import { LESSON_BLOCKS, LessonBody, MissionBar, TextMessage } from "./parts";
import { lesson, type Msg } from "./mock";

export type VariantProps = { msgs: Msg[]; visible: number; chosen: number | null; onAnswer: (i: number) => void; onSend: (t: string) => void };

function useIsPhone() {
  const q = "(max-width: 767px)";
  const [v, set] = useState(() => matchMedia(q).matches);
  useEffect(() => { const m = matchMedia(q); const f = () => set(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  return v;
}

function Chat({ msgs, onSend, renderLesson, density }: Pick<VariantProps, "msgs" | "onSend"> & { renderLesson: () => React.ReactNode; density?: "compact" | "balanced" }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <ChatLayout density={density} composer={<ChatComposer onSubmit={onSend} placeholder="Message your Teacher" density={density} />}>
        <ChatMessageList density={density}>
          {msgs.map((m) => m.from === "lesson" ? <div key={m.id}>{renderLesson()}</div> : <TextMessage key={m.id} m={m} />)}
        </ChatMessageList>
      </ChatLayout>
    </div>
  );
}

function LessonCard({ visible, onOpen }: { visible: number; onOpen: () => void }) {
  const writing = visible < LESSON_BLOCKS;
  return (
    <ClickableCard label={`Open Lesson ${lesson.number}`} onClick={onOpen}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="lesson-eyebrow">Lesson {lesson.number} · {lesson.minutes} min</div>
          <div className="text-primary text-base font-semibold">{lesson.title}</div>
          <div className="text-secondary text-sm mt-1">{writing ? "Teacher is writing, open to read along" : "Includes a quiz"}</div>
        </div>
        {writing && <Spinner size="sm" />}
      </div>
    </ClickableCard>
  );
}

/** A: the Lesson is written straight into the conversation. Nothing opens. */
export function VariantA(p: VariantProps) {
  return (
    <div className="app">
      <MissionBar />
      <div className="flex-1 min-h-0 flex flex-col w-full max-w-[64rem] mx-auto">
        <Chat msgs={p.msgs} onSend={p.onSend} renderLesson={() => (
          <div className="border-y border-border py-6 my-2"><LessonBody visible={p.visible} chosen={p.chosen} onAnswer={p.onAnswer} /></div>
        )} />
      </div>
    </div>
  );
}

/** B: a card in the chat opens a reader. Desktop splits, chat stays live. Phone goes full-screen. */
export function VariantB(p: VariantProps) {
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);
  const body = <LessonBody visible={p.visible} chosen={p.chosen} onAnswer={p.onAnswer} />;
  return (
    <div className="app">
      <MissionBar />
      <div className="flex flex-1 min-h-0">
        <div className={`flex flex-col min-w-0 ${open && !phone ? "w-[26rem] shrink-0 border-r border-border" : "flex-1"}`}>
          <Chat msgs={p.msgs} onSend={p.onSend} density={open && !phone ? "compact" : undefined} renderLesson={() => <LessonCard visible={p.visible} onOpen={() => setOpen(true)} />} />
        </div>
        {!phone && open && (
          <div className="flex-1 min-w-0 overflow-y-auto bg-surface">
            <div className="flex justify-end p-2 sticky top-0"><Button label="Close" variant="secondary" size="sm" onClick={() => setOpen(false)} /></div>
            <div className="px-8 pb-16 max-w-[56rem] mx-auto">{body}</div>
          </div>
        )}
      </div>
      {phone && (
        <Drawer isOpen={open} onOpenChange={setOpen} label={`Lesson ${lesson.number}`} experimental={{ isFullWidthOnMobile: true }}>
          <DrawerHeader title={`Lesson ${lesson.number}`} onOpenChange={setOpen} hasDivider />
          <div className="p-5 pb-16">{body}</div>
        </Drawer>
      )}
    </div>
  );
}

/** C: the Lesson owns the page and the chat comes to it. Margin on desktop, pull-up sheet on phone. Pushes hardest against "chat-centred". */
export function VariantC(p: VariantProps) {
  const phone = useIsPhone();
  const [sheet, setSheet] = useState(false);
  const chat = <Chat msgs={p.msgs.filter((m) => m.from !== "lesson")} onSend={p.onSend} density="compact" renderLesson={() => null} />;
  const body = <LessonBody visible={p.visible} chosen={p.chosen} onAnswer={p.onAnswer} />;
  if (phone) return (
    <div className="app">
      <MissionBar />
      <div className="flex-1 min-h-0 overflow-y-auto p-5 pb-8 bg-surface">{body}</div>
      <div className="border-t border-border p-2 bg-surface shrink-0">
        <Button label="Talk to your Teacher" variant="secondary" width="100%" onClick={() => setSheet(true)} />
      </div>
      <BottomSheet isOpen={sheet} onOpenChange={setSheet} label="Conversation with your Teacher" height="tall">
        <div className="h-full flex flex-col">{chat}</div>
      </BottomSheet>
    </div>
  );
  return (
    <div className="app">
      <MissionBar />
      <div className="flex flex-1 min-h-0">
        <nav className="w-40 shrink-0 border-r border-border p-4 text-sm">
          <div className="lesson-eyebrow mb-2">Lessons</div>
          {[1, 2, 3].map((n) => <div key={n} className={`py-1 ${n === lesson.number ? "text-primary font-semibold" : "text-secondary"}`}>Lesson {n}</div>)}
        </nav>
        <main className="flex-1 min-w-0 overflow-y-auto bg-surface px-10 py-8">{body}</main>
        <aside className="w-[22rem] shrink-0 border-l border-border flex flex-col">{chat}</aside>
      </div>
    </div>
  );
}

// PROTOTYPE, throwaway. Imported by BOTH server (for library.prompt()) and client (for rendering).
import { createLibrary, defineComponent, useIsStreaming, useRenderNode, useStateField, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod/v4";

const Prose = defineComponent({
  name: "Prose",
  description: "A passage of teaching text. Separate paragraphs with a blank line.",
  props: z.object({ text: z.string() }),
  component: ({ props }) => <div className="prose">{String(props.text ?? "").split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>,
});

const Callout = defineComponent({
  name: "Callout",
  description: "A short aside the learner should not miss.",
  props: z.object({ text: z.string() }),
  component: ({ props }) => <aside className="callout">{props.text}</aside>,
});

const Quiz = defineComponent({
  name: "Quiz",
  description: "One multiple-choice question. correctIndex is the 0-based index of the right option.",
  props: z.object({
    id: z.string().describe("Short unique id, e.g. q1"),
    question: z.string(),
    options: z.array(z.string()),
    correctIndex: z.number(),
    explanation: z.string(),
  }),
  component: ({ props }) => {
    const streaming = useIsStreaming();
    const trigger = useTriggerAction();
    const field = useStateField<number | null>(`quiz_${props.id}`);
    const chosen = field.value as number | null | undefined;
    const answered = chosen !== null && chosen !== undefined;
    const options: string[] = props.options ?? [];
    return (
      <section className="quiz">
        <h4>{props.question}</h4>
        {options.map((o, i) => (
          <button
            key={i}
            disabled={streaming || answered}
            className={answered ? (i === props.correctIndex ? "right" : i === chosen ? "wrong" : "") : ""}
            onClick={() => {
              field.setValue(i);
              trigger(o, undefined, {
                type: "quiz_answer",
                params: { quizId: props.id, question: props.question, chosen: o, correct: options[props.correctIndex], isCorrect: i === props.correctIndex },
              });
            }}
          >{o}</button>
        ))}
        {answered && <p className="explanation">{props.explanation}</p>}
      </section>
    );
  },
});

const Lesson = defineComponent({
  name: "Lesson",
  description: "Root of every Lesson.",
  props: z.object({ title: z.string(), children: z.array(z.union([Prose.ref, Callout.ref, Quiz.ref])) }),
  component: ({ props }) => {
    const render = useRenderNode();
    return <article className="lesson"><h3>{props.title}</h3>{render(props.children)}</article>;
  },
});

export const library = createLibrary({ root: "Lesson", components: [Lesson, Prose, Callout, Quiz] });

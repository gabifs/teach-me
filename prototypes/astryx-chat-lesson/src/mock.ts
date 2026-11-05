// PROTOTYPE, throwaway. All content is static; no model is called.
export const mission = "Play Wonderwall at Ana's birthday in six weeks";

export type Msg =
  | { id: string; from: "teacher" | "learner"; text: string; tokens?: number }
  | { id: string; from: "lesson" };

export const initialMessages: Msg[] = [
  { id: "m1", from: "learner", text: "I can hold the chords now, but I stop dead every time I change." },
  { id: "m2", from: "teacher", text: "That fits what you showed in **Lesson 2**: clean chords, slow changes. So next we work on the change itself, not the strumming.\n\nI've written you a short one.", tokens: 1284 },
  { id: "lesson", from: "lesson" },
];

export const lesson = { number: 3, title: "Change from Em7 to G without stopping", minutes: 5 };
export const quiz = {
  question: "Going from Em7 to G, which finger actually has to move?",
  options: ["Index", "Middle", "Ring", "Pinky"],
  correct: 1,
  explanation: "Only the middle finger moves, from the D string to the low E string. The other three stay down.",
};
export const sources = [
  { title: "JustinGuitar: One Minute Changes", url: "https://www.justinguitar.com/" },
  { title: "r/guitar: beginner practice threads", url: "https://www.reddit.com/r/guitar/" },
];
export const replies = (isCorrect: boolean) =>
  isCorrect
    ? "Right, and that's the whole trick. Try a minute of changes and tell me how many you got. I'll choose the next Lesson from that number."
    : "Close. Look at the shapes again: three fingers stay down and only the middle finger travels. Try it slowly on the guitar, then tell me if it clicks.";

// PROTOTYPE: canned LanguageModelV2 so the pipeline runs without a key (pnpm mock). Says nothing about real model output.
const LESSON = `root = Lesson("Why the sky is blue", [p1, c1, q1])
p1 = Prose("Sunlight looks white but mixes every colour. Air molecules scatter short wavelengths far more than long ones.\\n\\nBlue light gets bounced around the whole sky, so blue reaches your eye from every direction.")
c1 = Callout("Shorter wavelength, more scattering. That one rule explains it.")
q1 = Quiz("q1", "Why does blue dominate the daytime sky?", ["Air scatters short wavelengths most", "Sunlight contains mostly blue light"], 0, "Sunlight has all colours; scattering favours the short blue wavelengths.")
`;

const usage = { inputTokens: 100, outputTokens: 50, totalTokens: 150 };
function streamOf(parts: any[], delay = 0) {
  return new ReadableStream({
    async start(c) {
      for (const p of parts) { if (delay) await new Promise((r) => setTimeout(r, delay)); c.enqueue(p); }
      c.close();
    },
  });
}
const textParts = (text: string, size: number) => {
  const out: any[] = [{ type: "text-start", id: "t" }];
  for (let i = 0; i < text.length; i += size) out.push({ type: "text-delta", id: "t", delta: text.slice(i, i + size) });
  out.push({ type: "text-end", id: "t" });
  return out;
};
const finish = (finishReason: string) => ({ type: "finish", finishReason, usage });

export const mockModel = (name: "teacher" | "writer") => ({
  specificationVersion: "v2", provider: "mock", modelId: `mock-${name}`, supportedUrls: {},
  doGenerate: async () => { throw new Error("mock supports streaming only"); },
  doStream: async ({ prompt }: any) => {
    const start = { type: "stream-start", warnings: [] };
    if (name === "writer") return { stream: streamOf([start, ...textParts(LESSON, 14), finish("stop")], 40) };
    const last = prompt[prompt.length - 1];
    if (last.role === "tool") return { stream: streamOf([start, ...textParts("Try the quiz at the end when you're ready.", 6), finish("stop")], 30) };
    const said = JSON.stringify(last.content);
    if (said.includes("[quiz answer]")) return { stream: streamOf([start, ...textParts(said.includes("Right.") ? "**Nice**: you tied it to wavelength, not to the sunlight itself." : "Common mix-up. Sunlight has every colour; the scattering is what picks blue.", 6), finish("stop")], 30) };
    return { stream: streamOf([start, { type: "tool-call", toolCallId: `c${Date.now()}`, toolName: "create_lesson", input: JSON.stringify({ title: "Why the sky is blue", brief: "Rayleigh scattering in one idea" }) }, finish("tool-calls")]) };
  },
});

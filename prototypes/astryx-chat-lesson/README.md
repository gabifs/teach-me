# PROTOTYPE, throwaway. Never merged.

Answers: does Astryx work with Vite, Tailwind and Capacitor, and how should chat and Lessons look?

**Verdict:** Astryx works. Variant B (Lesson card in chat opens a reader) with the neutral theme in light and dark. iOS was not compiled.

## Run

    pnpm install
    pnpm start        # http://localhost:5198/?variant=A|B|C&theme=neutral|stone|gothic&mode=light|dark

The dark pill switches variant, theme and mode. `stream` replays Lesson writing. All content is mock; no model is called.

Android (needs the JDK 21 bundled with Android Studio):

    pnpm build && pnpm exec cap sync
    cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug

## Variants

- **A, inline:** Lesson written into the chat. `src/variants.tsx`
- **B, card opens reader (chosen):** split on desktop, full-screen Drawer on phone.
- **C, Lesson owns page:** chat in margin or bottom sheet.

`evidence/` holds screenshots and the scripts that drove the checks. Those scripts are not runnable as they stand: they need Playwright and, for `quiz.mjs`, an emulator with a forwarded WebView port.

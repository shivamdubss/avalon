import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "speechSynthesis", {
  value: {
    cancel: () => undefined,
    getVoices: () => [],
    speak: () => undefined
  },
  writable: true
});


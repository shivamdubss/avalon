import type { NarrationStep, RoleConfig } from "@/lib/types";

export function estimateNarrationDuration(step: Pick<NarrationStep, "spokenText">) {
  const wordCount = step.spokenText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2_400, wordCount * 340);
}

export function buildNarrationSteps(config: RoleConfig): NarrationStep[] {
  const steps: NarrationStep[] = [];

  steps.push(createStep("close-eyes", "Everyone, close your eyes and extend your fist into the center."));

  if (config.oberon) {
    steps.push(
      createStep(
        "evil-open",
        "Minions of Mordred, except Oberon, open your eyes and look around so that you may know each other."
      )
    );
  } else {
    steps.push(
      createStep(
        "evil-open",
        "Minions of Mordred, open your eyes and look around so that you may know each other."
      )
    );
  }

  steps.push(
    createStep(
      "evil-close",
      "Minions of Mordred, close your eyes. All players, extend your thumb."
    )
  );

  if (config.mordred) {
    steps.push(
      createStep(
        "merlin-open",
        "Merlin, open your eyes. The players with their thumbs raised are Minions of Mordred, except Mordred."
      )
    );
  } else {
    steps.push(
      createStep(
        "merlin-open",
        "Merlin, open your eyes. The players with their thumbs raised are Minions of Mordred."
      )
    );
  }

  steps.push(
    createStep(
      "merlin-close",
      "Merlin, close your eyes and lower your thumb.",
      ["merlin"]
    )
  );

  if (config.percival) {
    steps.push(
      createStep(
        "percival-open",
        config.morgana
          ? "Percival, open your eyes. The players with their thumbs raised are Merlin and Morgana."
          : "Percival, open your eyes. The player with a thumb raised is Merlin.",
        ["percival"]
      )
    );
    steps.push(createStep("percival-close", "Percival, close your eyes.", ["percival"]));
  }

  if (config.oberon) {
    steps.push(
      createStep(
        "oberon-note",
        "Oberon remains hidden and never opened eyes with the other Minions of Mordred."
      )
    );
  }

  steps.push(createStep("open-eyes", "Everyone, open your eyes."));

  return steps;
}

export function getNarrationDuration(steps: NarrationStep[]) {
  return steps.reduce((total, step) => total + step.durationMs, 0);
}

export function getNarrationStepAtTime(steps: NarrationStep[], startedAt: number, now = Date.now()) {
  const elapsed = now - startedAt;
  let cursor = 0;

  for (const step of steps) {
    cursor += step.durationMs;
    if (elapsed <= cursor) {
      return step;
    }
  }

  return steps.at(-1) ?? null;
}

export function createSpeechRunner(
  steps: NarrationStep[],
  options?: {
    voiceName?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }
) {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const timers = new Set<number>();

  return {
    supported: isSupported,
    start(startedAt: number) {
      if (!isSupported) {
        return;
      }

      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      const chosenVoice = options?.voiceName
        ? voices.find((voice) => voice.name === options.voiceName)
        : voices[0];

      let offset = 0;

      synth.cancel();

      for (const step of steps) {
        const timer = window.setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(step.spokenText);
          utterance.voice = chosenVoice ?? null;
          utterance.rate = options?.rate ?? 0.95;
          utterance.pitch = options?.pitch ?? 0.9;
          utterance.volume = options?.volume ?? 1;
          synth.speak(utterance);
        }, Math.max(0, startedAt + offset - Date.now()));

        timers.add(timer);
        offset += step.durationMs;
      }
    },
    stop() {
      if (!isSupported) {
        return;
      }

      for (const timer of timers) {
        window.clearTimeout(timer);
      }

      timers.clear();
      window.speechSynthesis.cancel();
    }
  };
}

function createStep(id: string, spokenText: string, knowledgeRecipients?: NarrationStep["knowledgeRecipients"]) {
  return {
    id,
    caption: spokenText,
    spokenText,
    knowledgeRecipients,
    durationMs: estimateNarrationDuration({ spokenText })
  };
}


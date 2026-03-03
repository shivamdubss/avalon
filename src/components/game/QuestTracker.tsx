import type { QuestPublicView } from "@/lib/types";

export function QuestTracker({
  quests,
  currentQuestIndex
}: {
  quests: QuestPublicView[];
  currentQuestIndex: number;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {quests.map((quest, index) => (
        <div
          className={`rounded-2xl border px-2 py-3 text-center ${
            quest.status === "passed"
              ? "border-royal/50 bg-royal/15"
              : quest.status === "failed"
                ? "border-ember/50 bg-ember/15"
                : index === currentQuestIndex
                  ? "border-gild/50 bg-gild/10"
                  : "border-white/10 bg-white/5"
          }`}
          key={quest.index}
        >
          <p className="text-[10px] uppercase tracking-[0.18em] text-mist/70">Quest {quest.index + 1}</p>
          <p className="mt-2 text-2xl font-semibold text-parchment">{quest.teamSize}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-mist/60">
            {quest.requiresTwoFails ? "Two fails" : "One fail"}
          </p>
        </div>
      ))}
    </div>
  );
}


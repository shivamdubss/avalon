import { Card } from "@/components/ui/Card";
import type { SharedRoomView } from "@/lib/types";

export function QuestResultsPanel({ room }: { room: SharedRoomView }) {
  const result = room.quests[room.currentQuestIndex]?.questVotes;

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Quest Results</p>
        <h3 className="font-display text-3xl text-parchment">The outcome is public, the culprit is not</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-royal/30 bg-royal/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-royal">Success</p>
          <p className="mt-2 text-4xl font-semibold text-parchment">{result?.success ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-ember/30 bg-ember/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-ember">Fail</p>
          <p className="mt-2 text-4xl font-semibold text-parchment">{result?.fail ?? 0}</p>
        </div>
      </div>
    </Card>
  );
}


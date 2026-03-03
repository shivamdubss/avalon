import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function QuestVotePanel({
  locked,
  allowFail,
  onVote
}: {
  locked: boolean;
  allowFail: boolean;
  onVote: (vote: "success" | "fail") => void;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Quest Vote</p>
        <h3 className="font-display text-3xl text-parchment">Seal your choice in secret</h3>
      </div>
      <div className={`grid gap-3 ${allowFail ? "grid-cols-2" : "grid-cols-1"}`}>
        <Button data-testid="quest-success-button" disabled={locked} onClick={() => onVote("success")}>
          Success
        </Button>
        {allowFail ? (
          <Button data-testid="quest-fail-button" disabled={locked} onClick={() => onVote("fail")} variant="danger">
            Fail
          </Button>
        ) : null}
      </div>
      {locked ? <p className="text-sm text-mist/70">Your quest vote is hidden and locked.</p> : null}
    </Card>
  );
}


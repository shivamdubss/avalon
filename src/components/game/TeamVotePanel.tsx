import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function TeamVotePanel({
  locked,
  onVote
}: {
  locked: boolean;
  onVote: (approve: boolean) => void;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Council Vote</p>
        <h3 className="font-display text-3xl text-parchment">Approve the proposed team?</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button data-testid="approve-team-button" disabled={locked} onClick={() => onVote(true)}>
          Approve
        </Button>
        <Button data-testid="reject-team-button" disabled={locked} onClick={() => onVote(false)} variant="danger">
          Reject
        </Button>
      </div>
      {locked ? <p className="text-sm text-mist/70">Your vote is locked in.</p> : null}
    </Card>
  );
}


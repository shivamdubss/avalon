"use client";

import { PHASE_TITLES } from "@/lib/constants";
import type { PrivatePlayerView, RoleConfig, SharedRoomView } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LobbyPanel } from "@/components/lobby/LobbyPanel";
import { AssassinPanel } from "@/components/game/AssassinPanel";
import { GameOverPanel } from "@/components/game/GameOverPanel";
import { NarrationPanel } from "@/components/game/NarrationPanel";
import { PlayerList } from "@/components/game/PlayerList";
import { PrivateIntelPanel } from "@/components/game/PrivateIntelPanel";
import { QuestResultsPanel } from "@/components/game/QuestResultsPanel";
import { QuestTracker } from "@/components/game/QuestTracker";
import { QuestVotePanel } from "@/components/game/QuestVotePanel";
import { ReconnectOverlay } from "@/components/game/ReconnectOverlay";
import { RoleRevealPanel } from "@/components/game/RoleRevealPanel";
import { TeamBuilder } from "@/components/game/TeamBuilder";
import { TeamVotePanel } from "@/components/game/TeamVotePanel";
import { VoteResultsPanel } from "@/components/game/VoteResultsPanel";

export function GameBoardShell({
  room,
  you,
  connectionStatus,
  privateIntelOpen,
  setPrivateIntelOpen,
  roleCardRevealed,
  setRoleCardRevealed,
  pendingTeamSelection,
  togglePendingTeamSelection,
  forceCaptionsOnly,
  setForceCaptionsOnly,
  onRoleConfigChange,
  onKickPlayer,
  onStartGame,
  onReady,
  onStartNarration,
  onProposeTeam,
  onTeamVote,
  onQuestVote,
  onAssassinTarget,
  onPlayAgain
}: {
  room: SharedRoomView;
  you: PrivatePlayerView;
  connectionStatus: string;
  privateIntelOpen: boolean;
  setPrivateIntelOpen: (open: boolean) => void;
  roleCardRevealed: boolean;
  setRoleCardRevealed: (revealed: boolean) => void;
  pendingTeamSelection: string[];
  togglePendingTeamSelection: (playerId: string, max: number) => void;
  forceCaptionsOnly: boolean;
  setForceCaptionsOnly: (enabled: boolean) => void;
  onRoleConfigChange: (config: RoleConfig) => void;
  onKickPlayer: (playerId: string) => void;
  onStartGame: () => void;
  onReady: () => void;
  onStartNarration: () => void;
  onProposeTeam: () => void;
  onTeamVote: (approve: boolean) => void;
  onQuestVote: (vote: "success" | "fail") => void;
  onAssassinTarget: (playerId: string) => void;
  onPlayAgain: () => void;
}) {
  const currentQuest = room.quests[room.currentQuestIndex];
  const phaseTitle = PHASE_TITLES[room.phase];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-5 pb-24 sm:px-6 lg:px-8">
      <header className="grid gap-3 rounded-[30px] border border-white/8 bg-[rgba(10,15,28,0.88)] p-5 shadow-panel lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-mist/70">Avalon Room</p>
          <h1 className="font-display text-4xl text-parchment">{room.code}</h1>
          <p className="mt-1 text-sm text-mist/75">{phaseTitle}</p>
        </div>
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Connection</p>
          <p className="mt-2 text-2xl font-semibold capitalize text-parchment">{connectionStatus}</p>
        </div>
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Rejected Teams</p>
          <p className="mt-2 text-2xl font-semibold text-parchment">{room.consecutiveRejections} / 5</p>
        </div>
      </header>

      <ReconnectOverlay room={room} />

      {room.phase === "lobby" ? (
        <LobbyPanel
          onKickPlayer={onKickPlayer}
          onRoleConfigChange={onRoleConfigChange}
          onStartGame={onStartGame}
          room={room}
          you={you}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <section className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Board State</p>
                  <h2 className="font-display text-3xl text-parchment">The kingdom watches</h2>
                </div>
                <div className="flex gap-2">
                  <Badge tone="gold">Leader: {room.players.find((player) => player.playerId === room.leaderPlayerId)?.name}</Badge>
                  {room.winner ? <Badge tone={room.winner === "good" ? "good" : "evil"}>{room.winner}</Badge> : null}
                </div>
              </div>
              {room.quests.length > 0 ? (
                <QuestTracker currentQuestIndex={room.currentQuestIndex} quests={room.quests} />
              ) : null}
            </Card>

            {room.phase === "role-reveal" ? (
              <RoleRevealPanel
                canStartNarration={you.allowedActions.includes("start-narration")}
                forceCaptionsOnly={forceCaptionsOnly}
                onForceCaptionsOnly={setForceCaptionsOnly}
                onReady={onReady}
                onReveal={setRoleCardRevealed}
                onStartNarration={onStartNarration}
                revealed={roleCardRevealed}
                you={you}
              />
            ) : null}

            {room.phase === "narration" && room.narration ? (
              <NarrationPanel
                isSpeaker={room.narration.speakerPlayerId === you.playerId}
                narration={room.narration}
                secretKnowledge={you.secretKnowledge}
              />
            ) : null}

            {room.phase === "team-building" ? (
              <TeamBuilder
                onSubmit={onProposeTeam}
                onTogglePlayer={(playerId) => togglePendingTeamSelection(playerId, currentQuest?.teamSize ?? 0)}
                pendingSelection={pendingTeamSelection}
                room={room}
                you={you}
              />
            ) : null}

            {room.phase === "team-vote" ? (
              <TeamVotePanel
                locked={!you.allowedActions.includes("submit-team-vote")}
                onVote={onTeamVote}
              />
            ) : null}

            {room.phase === "team-vote-results" ? <VoteResultsPanel room={room} /> : null}

            {room.phase === "quest-vote" ? (
              <QuestVotePanel
                allowFail={you.team === "evil"}
                locked={!you.allowedActions.includes("submit-quest-vote")}
                onVote={onQuestVote}
              />
            ) : null}

            {room.phase === "quest-results" ? <QuestResultsPanel room={room} /> : null}

            {room.phase === "assassin" ? (
              <AssassinPanel onSelect={onAssassinTarget} room={room} you={you} />
            ) : null}

            {room.phase === "game-over" ? (
              <GameOverPanel onPlayAgain={onPlayAgain} room={room} you={you} />
            ) : null}
          </section>

          <aside className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-mist/70">Roster</p>
                  <h3 className="font-display text-3xl text-parchment">Court Seats</h3>
                </div>
                <Button
                  onMouseDown={() => setPrivateIntelOpen(true)}
                  onMouseLeave={() => setPrivateIntelOpen(false)}
                  onMouseUp={() => setPrivateIntelOpen(false)}
                  onTouchEnd={() => setPrivateIntelOpen(false)}
                  onTouchStart={() => setPrivateIntelOpen(true)}
                  type="button"
                  variant="ghost"
                >
                  Hold for Intel
                </Button>
              </div>
              <PlayerList room={room} />
            </Card>
            {privateIntelOpen ? <PrivateIntelPanel you={you} /> : null}
          </aside>
        </div>
      )}
    </div>
  );
}


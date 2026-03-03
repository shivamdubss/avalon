import { GameRoomClient } from "@/components/game/GameRoomClient";

export default function GameRoomPage({
  params
}: {
  params: {
    code: string;
  };
}) {
  return <GameRoomClient roomCode={params.code} />;
}


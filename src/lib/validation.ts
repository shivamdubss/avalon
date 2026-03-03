import { z } from "zod";

import type { ClientMessage } from "@/lib/types";

export const roleConfigSchema = z.object({
  percival: z.boolean(),
  morgana: z.boolean(),
  mordred: z.boolean(),
  oberon: z.boolean()
});

const joinRoomSchema = z.object({
  roomCode: z.string().min(4).max(6),
  name: z.string().trim().min(1).max(24),
  sessionId: z.string().min(4),
  intent: z.enum(["create", "join"])
});

export const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join_room"), payload: joinRoomSchema }),
  z.object({ type: z.literal("set_role_config"), payload: roleConfigSchema }),
  z.object({
    type: z.literal("kick_player"),
    payload: z.object({ playerId: z.string().min(1) })
  }),
  z.object({ type: z.literal("start_game") }),
  z.object({
    type: z.literal("set_ready"),
    payload: z.object({ ready: z.boolean() })
  }),
  z.object({
    type: z.literal("start_narration"),
    payload: z.object({ captionsOnly: z.boolean() })
  }),
  z.object({
    type: z.literal("propose_team"),
    payload: z.object({ playerIds: z.array(z.string().min(1)).min(1).max(5) })
  }),
  z.object({
    type: z.literal("submit_team_vote"),
    payload: z.object({ approve: z.boolean() })
  }),
  z.object({
    type: z.literal("submit_quest_vote"),
    payload: z.object({ vote: z.enum(["success", "fail"]) })
  }),
  z.object({
    type: z.literal("submit_assassin_target"),
    payload: z.object({ playerId: z.string().min(1) })
  }),
  z.object({ type: z.literal("restart_lobby") }),
  z.object({ type: z.literal("ping") })
]);

export function parseClientMessage(raw: string) {
  const parsedJson = JSON.parse(raw) as unknown;
  return clientMessageSchema.parse(parsedJson) as ClientMessage;
}


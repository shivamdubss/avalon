import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateJoinCard } from "@/components/landing/CreateJoinCard";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

describe("CreateJoinCard", () => {
  beforeEach(() => {
    push.mockReset();
    window.sessionStorage.clear();
  });

  it("stores a pending create intent and routes into the room", () => {
    render(<CreateJoinCard />);

    fireEvent.change(screen.getByTestId("player-name-input"), {
      target: { value: "Morgan" }
    });
    fireEvent.click(screen.getByTestId("create-join-submit"));

    const pending = JSON.parse(window.sessionStorage.getItem("avalon:pending-join") ?? "{}");
    expect(pending.name).toBe("Morgan");
    expect(pending.intent).toBe("create");
    expect(push).toHaveBeenCalledTimes(1);
  });
});

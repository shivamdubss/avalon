import { describe, expect, it } from "vitest";

import { resolvePartyKitSocketOptions } from "@/lib/party";

describe("resolvePartyKitSocketOptions", () => {
  it("uses the explicit host and protocol override when provided", () => {
    expect(
      resolvePartyKitSocketOptions({
        envHost: "party.example.com",
        envProtocol: "wss",
        location: { hostname: "192.168.1.20", protocol: "http:" }
      })
    ).toEqual({
      host: "party.example.com",
      protocol: "wss"
    });
  });

  it("derives the local PartyKit host from the current browser hostname", () => {
    expect(
      resolvePartyKitSocketOptions({
        location: { hostname: "192.168.1.20", protocol: "http:" }
      })
    ).toEqual({
      host: "192.168.1.20:1999",
      protocol: "ws"
    });
  });

  it("normalizes loopback hostnames to the default local endpoint", () => {
    expect(
      resolvePartyKitSocketOptions({
        location: { hostname: "localhost", protocol: "http:" }
      })
    ).toEqual({
      host: "127.0.0.1:1999",
      protocol: "ws"
    });
  });

  it("replaces a loopback env host when the browser is on a LAN hostname", () => {
    expect(
      resolvePartyKitSocketOptions({
        envHost: "127.0.0.1:1999",
        location: { hostname: "192.168.1.20", protocol: "http:" }
      })
    ).toEqual({
      host: "192.168.1.20:1999",
      protocol: "ws"
    });
  });

  it("infers a secure socket from the page protocol when there is no override", () => {
    expect(
      resolvePartyKitSocketOptions({
        envHost: "party.example.com",
        location: { hostname: "avalon.example.com", protocol: "https:" }
      })
    ).toEqual({
      host: "party.example.com",
      protocol: "wss"
    });
  });

  it("respects a protocol embedded in the configured host", () => {
    expect(
      resolvePartyKitSocketOptions({
        envHost: "https://party.example.com/",
        location: { hostname: "avalon.example.com", protocol: "http:" }
      })
    ).toEqual({
      host: "party.example.com",
      protocol: "wss"
    });
  });
});

const DEFAULT_PARTYKIT_HOST = "127.0.0.1";
const DEFAULT_PARTYKIT_PORT = "1999";

type BrowserLocationLike = Pick<Location, "hostname" | "protocol">;

interface ResolvePartyKitSocketOptionsArgs {
  envHost?: string;
  envProtocol?: string;
  location?: BrowserLocationLike;
}

export interface PartyKitSocketOptions {
  host: string;
  protocol: "ws" | "wss";
}

export function resolvePartyKitSocketOptions({
  envHost,
  envProtocol,
  location
}: ResolvePartyKitSocketOptionsArgs): PartyKitSocketOptions {
  const host = resolvePartyKitHost(envHost, location);

  return {
    host,
    protocol: resolvePartyKitProtocol(envProtocol, envHost, location)
  };
}

function resolvePartyKitHost(envHost?: string, location?: BrowserLocationLike) {
  const configuredHost = normalizeHost(envHost);

  if (configuredHost) {
    const browserHostname = location?.hostname?.trim();
    const configuredParts = parseHostParts(configuredHost);

    if (
      browserHostname &&
      !isLoopbackHost(browserHostname) &&
      configuredParts &&
      isLoopbackHost(configuredParts.hostname)
    ) {
      return configuredParts.port ? `${browserHostname}:${configuredParts.port}` : browserHostname;
    }

    return configuredHost;
  }

  const hostname = location?.hostname?.trim();

  if (!hostname || isLoopbackHost(hostname)) {
    return `${DEFAULT_PARTYKIT_HOST}:${DEFAULT_PARTYKIT_PORT}`;
  }

  return `${hostname}:${DEFAULT_PARTYKIT_PORT}`;
}

function resolvePartyKitProtocol(
  envProtocol?: string,
  envHost?: string,
  location?: BrowserLocationLike
): "ws" | "wss" {
  if (envProtocol === "ws" || envProtocol === "wss") {
    return envProtocol;
  }

  const host = envHost?.trim().toLowerCase();

  if (host?.startsWith("ws://") || host?.startsWith("http://")) {
    return "ws";
  }

  if (host?.startsWith("wss://") || host?.startsWith("https://")) {
    return "wss";
  }

  return location?.protocol === "https:" ? "wss" : "ws";
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

function normalizeHost(host?: string) {
  if (!host) {
    return undefined;
  }

  return host
    .trim()
    .replace(/^(http|https|ws|wss):\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\/+$/, "");
}

function parseHostParts(host: string) {
  if (host.startsWith("[")) {
    const closingBracketIndex = host.indexOf("]");

    if (closingBracketIndex === -1) {
      return null;
    }

    const hostname = host.slice(0, closingBracketIndex + 1);
    const port = host.slice(closingBracketIndex + 2) || undefined;
    return { hostname, port };
  }

  const [hostname, port] = host.split(":");

  if (!hostname) {
    return null;
  }

  return { hostname, port };
}

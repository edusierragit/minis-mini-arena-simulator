import { describe, expect, it } from "vitest";
import { buildRedirectDestination } from "../src/deployment";

describe("staged deployment redirect", () => {
  it("stays disabled until a canonical deployment is configured", () => {
    expect(buildRedirectDestination(undefined, "https://old.example/game/")).toBeNull();
  });

  it("preserves shared-link campaigns and fragments", () => {
    expect(buildRedirectDestination(
      "https://arena.pages.dev/",
      "https://old-host.example/minis-mini-arena-simulator/?utm_source=whatsapp#practice",
    )).toBe("https://arena.pages.dev/?utm_source=whatsapp#practice");
  });

  it("rejects insecure and looping destinations", () => {
    expect(buildRedirectDestination("http://arena.example/", "https://old.example/")).toBeNull();
    expect(buildRedirectDestination("https://old.example/game/", "https://old.example/game/")).toBeNull();
  });
});

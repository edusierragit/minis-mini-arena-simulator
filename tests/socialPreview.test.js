import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Node-only checks for the static metadata and published image artifact.
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const imageUrl = "https://minis-mini-arena-simulator.pages.dev/og.png";

describe("public social preview", () => {
  it("declares the same absolute image for Open Graph and X before JavaScript runs", () => {
    expect(html).toContain(`<meta property="og:image" content="${imageUrl}" />`);
    expect(html).toContain(`<meta name="twitter:image" content="${imageUrl}" />`);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta property="og:image:type" content="image/png" />');
    expect(html).toMatch(/<meta property="og:image:alt" content="[^"]+"/);
    expect(html).toMatch(/<meta name="twitter:image:alt" content="[^"]+"/);
  });

  it("ships a real public PNG with dimensions matching its metadata", () => {
    const image = readFileSync(new URL("../public/og.png", import.meta.url));
    expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    expect(width).toBeGreaterThanOrEqual(600);
    expect(height).toBeGreaterThanOrEqual(315);
    expect(width / height).toBeGreaterThanOrEqual(1.8);
    expect(width / height).toBeLessThanOrEqual(2.1);
    expect(image.length).toBeLessThan(5_000_000);
    expect(html).toContain(`<meta property="og:image:width" content="${width}" />`);
    expect(html).toContain(`<meta property="og:image:height" content="${height}" />`);
  });
});

import { describe, it, expect, afterEach, vi } from "vitest";

describe("config", () => {
  const originalEnv = process.env.YOUTUBE_API_KEY;

  afterEach(() => {
    vi.resetModules();
    if (originalEnv !== undefined) {
      process.env.YOUTUBE_API_KEY = originalEnv;
    } else {
      delete process.env.YOUTUBE_API_KEY;
    }
  });

  it("throws when YOUTUBE_API_KEY is missing", async () => {
    delete process.env.YOUTUBE_API_KEY;
    vi.resetModules();
    await expect(import("../src/config.js")).rejects.toThrow("YOUTUBE_API_KEY");
  });

  it("exports key when YOUTUBE_API_KEY is set", async () => {
    process.env.YOUTUBE_API_KEY = "test-key-123";
    vi.resetModules();
    const { config } = await import("../src/config.js");
    expect(config.YOUTUBE_API_KEY).toBe("test-key-123");
  });
});

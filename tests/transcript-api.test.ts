import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockTranscriptResponse } from "./fixtures/youtube-responses.js";

const mockFetchTranscript = vi.fn();

vi.mock("youtube-transcript-plus", () => ({
  fetchTranscript: mockFetchTranscript,
  YoutubeTranscriptDisabledError: class extends Error { constructor(m: string) { super(m); this.name = "YoutubeTranscriptDisabledError"; } },
  YoutubeTranscriptNotAvailableError: class extends Error { constructor(m: string) { super(m); this.name = "YoutubeTranscriptNotAvailableError"; } },
  YoutubeTranscriptNotAvailableLanguageError: class extends Error { constructor(m: string) { super(m); this.name = "YoutubeTranscriptNotAvailableLanguageError"; } },
  YoutubeTranscriptVideoUnavailableError: class extends Error { constructor(m: string) { super(m); this.name = "YoutubeTranscriptVideoUnavailableError"; } },
  YoutubeTranscriptInvalidVideoIdError: class extends Error { constructor(m: string) { super(m); this.name = "YoutubeTranscriptInvalidVideoIdError"; } },
}));

const { getTranscript } = await import("../src/transcript-api.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getTranscript", () => {
  it("calls fetchTranscript with correct params", async () => {
    mockFetchTranscript.mockResolvedValue(mockTranscriptResponse);
    await getTranscript("abc123", "en");
    expect(mockFetchTranscript).toHaveBeenCalledWith("abc123", { lang: "en" });
  });

  it("shapes response correctly (strips lang field)", async () => {
    mockFetchTranscript.mockResolvedValue(mockTranscriptResponse);
    const result = await getTranscript("abc123", "en");
    expect(result).toEqual([
      { text: "Hello world", offset: 0, duration: 2.5 },
      { text: "This is a test", offset: 2.5, duration: 3.0 },
      { text: "Goodbye", offset: 5.5, duration: 1.5 },
    ]);
  });

  it("passes custom language", async () => {
    mockFetchTranscript.mockResolvedValue([]);
    await getTranscript("abc123", "es");
    expect(mockFetchTranscript).toHaveBeenCalledWith("abc123", { lang: "es" });
  });

  it("propagates errors", async () => {
    mockFetchTranscript.mockRejectedValue(new Error("Network error"));
    await expect(getTranscript("abc123", "en")).rejects.toThrow("Network error");
  });
});

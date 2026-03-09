import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptInvalidVideoIdError,
} from "../transcript-api.js";

export function registerGetTranscript(server: McpServer) {
  server.tool(
    "get_transcript",
    "Get transcript/captions for a YouTube video",
    {
      videoId: z.string().describe("YouTube video ID"),
      lang: z.string().default("en").describe("Language code (default: en)"),
    },
    async ({ videoId, lang }) => {
      try {
        const data = await getTranscript(videoId, lang);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        if (error instanceof YoutubeTranscriptDisabledError) {
          return { content: [{ type: "text" as const, text: "Transcript is disabled for this video" }], isError: true };
        }
        if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
          return { content: [{ type: "text" as const, text: `Transcript not available in language "${lang}"` }], isError: true };
        }
        if (error instanceof YoutubeTranscriptNotAvailableError) {
          return { content: [{ type: "text" as const, text: "No transcript available for this video" }], isError: true };
        }
        if (error instanceof YoutubeTranscriptVideoUnavailableError) {
          return { content: [{ type: "text" as const, text: "Video is unavailable" }], isError: true };
        }
        if (error instanceof YoutubeTranscriptInvalidVideoIdError) {
          return { content: [{ type: "text" as const, text: `Invalid video ID: ${videoId}` }], isError: true };
        }
        return {
          content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}

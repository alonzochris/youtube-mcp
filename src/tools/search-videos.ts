import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchVideos } from "../youtube-api.js";

export function registerSearchVideos(server: McpServer) {
  server.tool(
    "search_videos",
    "Search YouTube videos by query",
    {
      query: z.string().describe("Search query"),
      maxResults: z.number().min(1).max(50).default(5).describe("Number of results (1-50, default 5)"),
    },
    async ({ query, maxResults }) => {
      try {
        const results = await searchVideos(query, maxResults);
        return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}

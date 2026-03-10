import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchChannels } from "../youtube-api.js";

export function registerSearchChannels(server: McpServer) {
  server.tool(
    "search_channels",
    "Search YouTube channels by topic and include channel screening metrics",
    {
      query: z.string().describe("Search query"),
      maxResults: z.number().min(1).max(50).default(5).describe("Number of results (1-50, default 5)"),
    },
    async ({ query, maxResults }) => {
      try {
        const results = await searchChannels(query, maxResults);
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

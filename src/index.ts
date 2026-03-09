import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSearchVideos } from "./tools/search-videos.js";
import { registerGetVideo } from "./tools/get-video.js";
import { registerGetTranscript } from "./tools/get-transcript.js";
import { registerGetChannel } from "./tools/get-channel.js";
import { registerGetChannelVideos } from "./tools/get-channel-videos.js";
import { registerGetPlaylist } from "./tools/get-playlist.js";
import { registerGetPlaylistItems } from "./tools/get-playlist-items.js";

const server = new McpServer({
  name: "youtube-mcp",
  version: "1.0.0",
});

// Register all 7 tools
registerSearchVideos(server);
registerGetVideo(server);
registerGetTranscript(server);
registerGetChannel(server);
registerGetChannelVideos(server);
registerGetPlaylist(server);
registerGetPlaylistItems(server);

const transport = new StdioServerTransport();
await server.connect(transport);

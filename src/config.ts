// Validates required env vars at startup — fails fast if missing
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  throw new Error(
    "YOUTUBE_API_KEY environment variable is required. " +
      "Set it in your MCP client config or .env file."
  );
}

export const config = { YOUTUBE_API_KEY } as const;

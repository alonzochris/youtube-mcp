import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mockSearchResponse,
  mockChannelSearchResponse,
  mockChannelSearchHydrationResponse,
  mockChannelSearchPartialHydrationResponse,
  mockVideoResponse,
  mockEmptyVideoResponse,
  mockChannelResponse,
  mockEmptyChannelResponse,
  mockPlaylistResponse,
  mockEmptyPlaylistResponse,
  mockPlaylistItemsResponse,
  mockEmptySearchResponse,
} from "./fixtures/youtube-responses.js";

// Mock the googleapis youtube client
const mockSearchList = vi.fn();
const mockVideosList = vi.fn();
const mockChannelsList = vi.fn();
const mockPlaylistsList = vi.fn();
const mockPlaylistItemsList = vi.fn();

vi.mock("@googleapis/youtube", () => ({
  youtube: () => ({
    search: { list: mockSearchList },
    videos: { list: mockVideosList },
    channels: { list: mockChannelsList },
    playlists: { list: mockPlaylistsList },
    playlistItems: { list: mockPlaylistItemsList },
  }),
}));

// Must mock config before importing youtube-api
vi.mock("../src/config.js", () => ({
  config: { YOUTUBE_API_KEY: "fake-key" },
}));

const {
  searchVideos,
  searchChannels,
  getVideoDetails,
  getChannelInfo,
  getChannelVideos,
  getPlaylistInfo,
  getPlaylistItems,
} = await import("../src/youtube-api.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchVideos", () => {
  it("passes correct params to youtube.search.list", async () => {
    mockSearchList.mockResolvedValue(mockSearchResponse);
    await searchVideos("test query", 5);
    expect(mockSearchList).toHaveBeenCalledWith({
      part: ["snippet"],
      q: "test query",
      type: ["video"],
      maxResults: 5,
    });
  });

  it("shapes response correctly", async () => {
    mockSearchList.mockResolvedValue(mockSearchResponse);
    const results = await searchVideos("test", 5);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      videoId: "abc123",
      title: "Test Video",
      channelTitle: "Test Channel",
      channelId: "UCtest",
      publishedAt: "2024-01-01T00:00:00Z",
      description: "A test video description",
    });
  });

  it("returns empty array when no results", async () => {
    mockSearchList.mockResolvedValue(mockEmptySearchResponse);
    const results = await searchVideos("nonexistent", 5);
    expect(results).toEqual([]);
  });

  it("propagates API errors", async () => {
    mockSearchList.mockRejectedValue(new Error("API quota exceeded"));
    await expect(searchVideos("test", 5)).rejects.toThrow("API quota exceeded");
  });
});

describe("searchChannels", () => {
  it("passes correct params to youtube.search.list and hydrates channels in one call", async () => {
    mockSearchList.mockResolvedValue(mockChannelSearchResponse);
    mockChannelsList.mockResolvedValue(mockChannelSearchHydrationResponse);

    await searchChannels("ai podcast", 5);

    expect(mockSearchList).toHaveBeenCalledWith({
      part: ["snippet"],
      q: "ai podcast",
      type: ["channel"],
      maxResults: 5,
    });
    expect(mockChannelsList).toHaveBeenCalledWith({
      part: ["snippet", "statistics"],
      id: ["UCtest", "UCother"],
    });
  });

  it("merges search results with screening metrics", async () => {
    mockSearchList.mockResolvedValue(mockChannelSearchResponse);
    mockChannelsList.mockResolvedValue(mockChannelSearchHydrationResponse);

    const results = await searchChannels("ai podcast", 5);

    expect(results).toEqual([
      {
        channelId: "UCtest",
        title: "Test Channel",
        description: "Channel description",
        customUrl: "@testchannel",
        publishedAt: "2020-01-01T00:00:00Z",
        subscriberCount: "10000",
        hiddenSubscriberCount: false,
        videoCount: "100",
        viewCount: "500000",
      },
      {
        channelId: "UCother",
        title: "Another Channel",
        description: "Another channel description",
        customUrl: "@anotherchannel",
        publishedAt: "2021-01-01T00:00:00Z",
        subscriberCount: "2500",
        hiddenSubscriberCount: true,
        videoCount: "40",
        viewCount: "90000",
      },
    ]);
  });

  it("returns empty array when no results and skips hydration", async () => {
    mockSearchList.mockResolvedValue(mockEmptySearchResponse);

    const results = await searchChannels("nonexistent", 5);

    expect(results).toEqual([]);
    expect(mockChannelsList).not.toHaveBeenCalled();
  });

  it("preserves search order and tolerates missing hydration data", async () => {
    mockSearchList.mockResolvedValue(mockChannelSearchResponse);
    mockChannelsList.mockResolvedValue(mockChannelSearchPartialHydrationResponse);

    const results = await searchChannels("ai podcast", 5);

    expect(results).toEqual([
      {
        channelId: "UCtest",
        title: "Test Channel",
        description: "Channel description",
        customUrl: "@testchannel",
        publishedAt: "2020-01-01T00:00:00Z",
        subscriberCount: "10000",
        hiddenSubscriberCount: false,
        videoCount: "100",
        viewCount: "500000",
      },
      {
        channelId: "UCother",
        title: "Another Channel",
        description: "Search description for another channel",
        customUrl: undefined,
        publishedAt: "2021-01-01T00:00:00Z",
        subscriberCount: undefined,
        hiddenSubscriberCount: undefined,
        videoCount: undefined,
        viewCount: undefined,
      },
    ]);
  });

  it("propagates search API errors", async () => {
    mockSearchList.mockRejectedValue(new Error("API quota exceeded"));

    await expect(searchChannels("ai podcast", 5)).rejects.toThrow("API quota exceeded");
  });

  it("propagates channel hydration errors", async () => {
    mockSearchList.mockResolvedValue(mockChannelSearchResponse);
    mockChannelsList.mockRejectedValue(new Error("Forbidden"));

    await expect(searchChannels("ai podcast", 5)).rejects.toThrow("Forbidden");
  });
});

describe("getVideoDetails", () => {
  it("passes correct params to youtube.videos.list", async () => {
    mockVideosList.mockResolvedValue(mockVideoResponse);
    await getVideoDetails("abc123");
    expect(mockVideosList).toHaveBeenCalledWith({
      part: ["snippet", "statistics", "contentDetails"],
      id: ["abc123"],
    });
  });

  it("shapes response correctly", async () => {
    mockVideosList.mockResolvedValue(mockVideoResponse);
    const result = await getVideoDetails("abc123");
    expect(result).toEqual({
      videoId: "abc123",
      title: "Test Video",
      channelTitle: "Test Channel",
      channelId: "UCtest",
      publishedAt: "2024-01-01T00:00:00Z",
      description: "Full description",
      duration: "PT10M30S",
      viewCount: "1000",
      likeCount: "50",
      commentCount: "10",
    });
  });

  it("throws when video not found", async () => {
    mockVideosList.mockResolvedValue(mockEmptyVideoResponse);
    await expect(getVideoDetails("notfound")).rejects.toThrow("Video not found: notfound");
  });

  it("propagates API errors", async () => {
    mockVideosList.mockRejectedValue(new Error("Forbidden"));
    await expect(getVideoDetails("abc123")).rejects.toThrow("Forbidden");
  });
});

describe("getChannelInfo", () => {
  it("passes correct params", async () => {
    mockChannelsList.mockResolvedValue(mockChannelResponse);
    await getChannelInfo("UCtest");
    expect(mockChannelsList).toHaveBeenCalledWith({
      part: ["snippet", "statistics"],
      id: ["UCtest"],
    });
  });

  it("shapes response correctly", async () => {
    mockChannelsList.mockResolvedValue(mockChannelResponse);
    const result = await getChannelInfo("UCtest");
    expect(result).toEqual({
      channelId: "UCtest",
      title: "Test Channel",
      description: "Channel description",
      customUrl: "@testchannel",
      publishedAt: "2020-01-01T00:00:00Z",
      subscriberCount: "10000",
      videoCount: "100",
      viewCount: "500000",
    });
  });

  it("throws when channel not found", async () => {
    mockChannelsList.mockResolvedValue(mockEmptyChannelResponse);
    await expect(getChannelInfo("notfound")).rejects.toThrow("Channel not found: notfound");
  });
});

describe("getChannelVideos", () => {
  it("passes correct params with date ordering", async () => {
    mockSearchList.mockResolvedValue(mockSearchResponse);
    await getChannelVideos("UCtest", 10);
    expect(mockSearchList).toHaveBeenCalledWith({
      part: ["snippet"],
      channelId: "UCtest",
      type: ["video"],
      order: "date",
      maxResults: 10,
    });
  });

  it("shapes response correctly", async () => {
    mockSearchList.mockResolvedValue(mockSearchResponse);
    const results = await getChannelVideos("UCtest", 10);
    expect(results[0]).toEqual({
      videoId: "abc123",
      title: "Test Video",
      publishedAt: "2024-01-01T00:00:00Z",
      description: "A test video description",
    });
  });
});

describe("getPlaylistInfo", () => {
  it("passes correct params", async () => {
    mockPlaylistsList.mockResolvedValue(mockPlaylistResponse);
    await getPlaylistInfo("PLtest");
    expect(mockPlaylistsList).toHaveBeenCalledWith({
      part: ["snippet", "contentDetails"],
      id: ["PLtest"],
    });
  });

  it("shapes response correctly", async () => {
    mockPlaylistsList.mockResolvedValue(mockPlaylistResponse);
    const result = await getPlaylistInfo("PLtest");
    expect(result).toEqual({
      playlistId: "PLtest",
      title: "Test Playlist",
      description: "Playlist description",
      channelTitle: "Test Channel",
      channelId: "UCtest",
      publishedAt: "2024-01-01T00:00:00Z",
      itemCount: 5,
    });
  });

  it("throws when playlist not found", async () => {
    mockPlaylistsList.mockResolvedValue(mockEmptyPlaylistResponse);
    await expect(getPlaylistInfo("notfound")).rejects.toThrow("Playlist not found: notfound");
  });
});

describe("getPlaylistItems", () => {
  it("passes correct params", async () => {
    mockPlaylistItemsList.mockResolvedValue(mockPlaylistItemsResponse);
    await getPlaylistItems("PLtest", 25);
    expect(mockPlaylistItemsList).toHaveBeenCalledWith({
      part: ["snippet"],
      playlistId: "PLtest",
      maxResults: 25,
    });
  });

  it("shapes response correctly", async () => {
    mockPlaylistItemsList.mockResolvedValue(mockPlaylistItemsResponse);
    const results = await getPlaylistItems("PLtest", 25);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      videoId: "vid1",
      title: "Playlist Item 1",
      position: 0,
      channelTitle: "Test Channel",
      publishedAt: "2024-01-01T00:00:00Z",
    });
  });
});

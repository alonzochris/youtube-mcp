// Shared fixture data for YouTube API mock responses

export const mockSearchResponse = {
  data: {
    items: [
      {
        id: { videoId: "abc123" },
        snippet: {
          title: "Test Video",
          channelTitle: "Test Channel",
          channelId: "UCtest",
          publishedAt: "2024-01-01T00:00:00Z",
          description: "A test video description",
        },
      },
      {
        id: { videoId: "def456" },
        snippet: {
          title: "Another Video",
          channelTitle: "Another Channel",
          channelId: "UCother",
          publishedAt: "2024-01-02T00:00:00Z",
          description: "Another description",
        },
      },
    ],
  },
};

export const mockVideoResponse = {
  data: {
    items: [
      {
        id: "abc123",
        snippet: {
          title: "Test Video",
          channelTitle: "Test Channel",
          channelId: "UCtest",
          publishedAt: "2024-01-01T00:00:00Z",
          description: "Full description",
        },
        contentDetails: {
          duration: "PT10M30S",
        },
        statistics: {
          viewCount: "1000",
          likeCount: "50",
          commentCount: "10",
        },
      },
    ],
  },
};

export const mockEmptyVideoResponse = {
  data: { items: [] },
};

export const mockChannelResponse = {
  data: {
    items: [
      {
        id: "UCtest",
        snippet: {
          title: "Test Channel",
          description: "Channel description",
          customUrl: "@testchannel",
          publishedAt: "2020-01-01T00:00:00Z",
        },
        statistics: {
          subscriberCount: "10000",
          videoCount: "100",
          viewCount: "500000",
        },
      },
    ],
  },
};

export const mockEmptyChannelResponse = {
  data: { items: [] },
};

export const mockPlaylistResponse = {
  data: {
    items: [
      {
        id: "PLtest",
        snippet: {
          title: "Test Playlist",
          description: "Playlist description",
          channelTitle: "Test Channel",
          channelId: "UCtest",
          publishedAt: "2024-01-01T00:00:00Z",
        },
        contentDetails: {
          itemCount: 5,
        },
      },
    ],
  },
};

export const mockEmptyPlaylistResponse = {
  data: { items: [] },
};

export const mockPlaylistItemsResponse = {
  data: {
    items: [
      {
        snippet: {
          resourceId: { videoId: "vid1" },
          title: "Playlist Item 1",
          position: 0,
          channelTitle: "Test Channel",
          publishedAt: "2024-01-01T00:00:00Z",
        },
      },
      {
        snippet: {
          resourceId: { videoId: "vid2" },
          title: "Playlist Item 2",
          position: 1,
          channelTitle: "Test Channel",
          publishedAt: "2024-01-02T00:00:00Z",
        },
      },
    ],
  },
};

export const mockTranscriptResponse = [
  { text: "Hello world", offset: 0, duration: 2.5, lang: "en" },
  { text: "This is a test", offset: 2.5, duration: 3.0, lang: "en" },
  { text: "Goodbye", offset: 5.5, duration: 1.5, lang: "en" },
];

export const mockEmptySearchResponse = {
  data: { items: [] },
};

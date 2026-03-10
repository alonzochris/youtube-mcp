import { youtube, youtube_v3 } from "@googleapis/youtube";
import { config } from "./config.js";

const yt = youtube({ version: "v3", auth: config.YOUTUBE_API_KEY });

export async function searchVideos(query: string, maxResults: number) {
  const res = await yt.search.list({
    part: ["snippet"],
    q: query,
    type: ["video"],
    maxResults,
  });

  return (res.data.items ?? []).map((item) => ({
    videoId: item.id?.videoId,
    title: item.snippet?.title,
    channelTitle: item.snippet?.channelTitle,
    channelId: item.snippet?.channelId,
    publishedAt: item.snippet?.publishedAt,
    description: item.snippet?.description,
  }));
}

export async function searchChannels(query: string, maxResults: number) {
  const res = await yt.search.list({
    part: ["snippet"],
    q: query,
    type: ["channel"],
    maxResults,
  });

  const searchItems = res.data.items ?? [];
  const channelIds = Array.from(
    new Set(searchItems.flatMap((item) => (item.id?.channelId ? [item.id.channelId] : item.snippet?.channelId ? [item.snippet.channelId] : [])))
  );

  const channelsById = new Map<string, youtube_v3.Schema$Channel>();

  if (channelIds.length > 0) {
    const channelRes = await yt.channels.list({
      part: ["snippet", "statistics"],
      id: channelIds,
    });

    for (const channel of channelRes.data.items ?? []) {
      if (channel.id) {
        channelsById.set(channel.id, channel);
      }
    }
  }

  return searchItems.map((item) => {
    const channelId = item.id?.channelId ?? item.snippet?.channelId;
    const channel = channelId ? channelsById.get(channelId) : undefined;

    return {
      channelId,
      title: channel?.snippet?.title ?? item.snippet?.title,
      description: channel?.snippet?.description ?? item.snippet?.description,
      customUrl: channel?.snippet?.customUrl,
      publishedAt: channel?.snippet?.publishedAt ?? item.snippet?.publishedAt,
      subscriberCount: channel?.statistics?.subscriberCount,
      hiddenSubscriberCount: channel?.statistics?.hiddenSubscriberCount,
      videoCount: channel?.statistics?.videoCount,
      viewCount: channel?.statistics?.viewCount,
    };
  });
}

export async function getVideoDetails(videoId: string) {
  const res = await yt.videos.list({
    part: ["snippet", "statistics", "contentDetails"],
    id: [videoId],
  });

  const video = res.data.items?.[0];
  if (!video) throw new Error(`Video not found: ${videoId}`);

  return {
    videoId: video.id,
    title: video.snippet?.title,
    channelTitle: video.snippet?.channelTitle,
    channelId: video.snippet?.channelId,
    publishedAt: video.snippet?.publishedAt,
    description: video.snippet?.description,
    duration: video.contentDetails?.duration,
    viewCount: video.statistics?.viewCount,
    likeCount: video.statistics?.likeCount,
    commentCount: video.statistics?.commentCount,
  };
}

export async function getChannelInfo(channelId: string) {
  const res = await yt.channels.list({
    part: ["snippet", "statistics"],
    id: [channelId],
  });

  const channel = res.data.items?.[0];
  if (!channel) throw new Error(`Channel not found: ${channelId}`);

  return {
    channelId: channel.id,
    title: channel.snippet?.title,
    description: channel.snippet?.description,
    customUrl: channel.snippet?.customUrl,
    publishedAt: channel.snippet?.publishedAt,
    subscriberCount: channel.statistics?.subscriberCount,
    videoCount: channel.statistics?.videoCount,
    viewCount: channel.statistics?.viewCount,
  };
}

export async function getChannelVideos(channelId: string, maxResults: number) {
  const res = await yt.search.list({
    part: ["snippet"],
    channelId,
    type: ["video"],
    order: "date",
    maxResults,
  });

  return (res.data.items ?? []).map((item) => ({
    videoId: item.id?.videoId,
    title: item.snippet?.title,
    publishedAt: item.snippet?.publishedAt,
    description: item.snippet?.description,
  }));
}

export async function getPlaylistInfo(playlistId: string) {
  const res = await yt.playlists.list({
    part: ["snippet", "contentDetails"],
    id: [playlistId],
  });

  const playlist = res.data.items?.[0];
  if (!playlist) throw new Error(`Playlist not found: ${playlistId}`);

  return {
    playlistId: playlist.id,
    title: playlist.snippet?.title,
    description: playlist.snippet?.description,
    channelTitle: playlist.snippet?.channelTitle,
    channelId: playlist.snippet?.channelId,
    publishedAt: playlist.snippet?.publishedAt,
    itemCount: playlist.contentDetails?.itemCount,
  };
}

export async function getPlaylistItems(playlistId: string, maxResults: number) {
  const res = await yt.playlistItems.list({
    part: ["snippet"],
    playlistId,
    maxResults,
  });

  return (res.data.items ?? []).map((item) => ({
    videoId: item.snippet?.resourceId?.videoId,
    title: item.snippet?.title,
    position: item.snippet?.position,
    channelTitle: item.snippet?.channelTitle,
    publishedAt: item.snippet?.publishedAt,
  }));
}

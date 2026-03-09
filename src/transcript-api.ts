// @ts-expect-error — bundled package has runtime exports but broken .d.ts paths for Node16 resolution
import { fetchTranscript, YoutubeTranscriptDisabledError, YoutubeTranscriptNotAvailableError, YoutubeTranscriptNotAvailableLanguageError, YoutubeTranscriptVideoUnavailableError, YoutubeTranscriptInvalidVideoIdError } from "youtube-transcript-plus";

export {
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptInvalidVideoIdError,
};

export async function getTranscript(videoId: string, lang: string) {
  const transcript = await fetchTranscript(videoId, { lang });
  return transcript.map((entry: { text: string; offset: number; duration: number }) => ({
    text: entry.text,
    offset: entry.offset,
    duration: entry.duration,
  }));
}

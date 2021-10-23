import YouTube from 'discord-youtube-api';
import { URLS } from './constants.js';

const youtube = new YouTube(process.env.YOUTUBE_API_KEY);

/**
 * Check whether or not a given url is valid.
 */
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

/**
 * Ensure a YouTube url is in the correct form, i.e. not in a mobile minifed form.
 */
export const getFullUrl = (url) => {
  if (url.includes(URLS.SHORT_TERM)) {
    const videoId = url.split(URLS.SHORT_TERM)[1];
    return `${URLS.LONG_BASE}${videoId}`;
  }

  return url;
};

/**
 * Convert a number of seconds into a readable hours/minutes/seconds format.
 */
export const formatTime = (durationSeconds) => {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = Math.floor(durationSeconds % 60).toString().padStart(2, 0);

  if (hours === 0) {
    return `${minutes}:${seconds}`;
  }

  return `${hours}:${minutes.toString().padStart(2, 0)}:${seconds}`;
};

/**
 * Generate a string progress bar for displaying the elapsed time as a fraction of the total duration of a song.
 */
export const getProgressBar = (elapsed, total) => {
  const totalPartitions = 20;
  const fraction = elapsed / total;
  const elapsedPartitions = Math.floor(fraction * totalPartitions);

  let progressBar = '';
  for (let i = 0; i < totalPartitions; i++) {
    if (i <= elapsedPartitions) progressBar += '▇';
    if (i > elapsedPartitions) progressBar += '—';
  }

  return `${progressBar} \`${formatTime(elapsed)} / ${formatTime(total)}\``;
};

/**
 * Retrieve YouTube video(s) given either a valid video url, playlist url, or plain text to search YouTube for a video.
 */
export const search = async (args) => {
  const firstArg = args[0];
  let videos = [];

  if (!isValidUrl(firstArg)) { // youtube search terms
    videos[0] = await youtube.searchVideos(args.join(' '));
  } else if (firstArg.includes('list=')) { // playlist url
    videos = await youtube.getPlaylist(firstArg);
  } else { // single video url
    const videoUrl = getFullUrl(firstArg);
    videos[0] = await youtube.getVideo(videoUrl);
  }

  return videos;
};

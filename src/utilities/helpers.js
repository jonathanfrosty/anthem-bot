import { searchSpotify, searchYouTube } from './api/index.js';

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
 * Convert a number of seconds into a readable hours/minutes/seconds format.
 */
export const formatTime = (durationSeconds) => {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = Math.floor(durationSeconds % 60)
    .toString()
    .padStart(2, 0);

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
 * Get the number of seconds from a string of the form "mm:ss", ensuring it is within the given range.
 * For example, "12:42" (12 minutes 42 seconds).
 */
export const getSeekSeconds = (string, maxSeconds) => {
  const rgx = /(\d*):(\d*)/;
  const [, mins, secs] = rgx.exec(string);

  if (!mins) return null;

  const seconds = +mins * 60 + +secs;

  if (seconds < 0 || seconds > maxSeconds) return null;

  return seconds;
};

/**
 * Map track data to be cached.
 */
export const mapToCache = (items) =>
  items.map(({ url, title, thumbnail, durationInSec }) => ({
    url,
    title,
    thumbnail,
    durationInSec,
  }));

/**
 * Retrieve YouTube video(s) given either a valid YouTube/Spotify video url, playlist url, or plain text to search YouTube for a video.
 * Will attempt to retry (up to 3 times) in the case of any errors during this process.
 */
export const search = async (args, cache, retryCount = 0) => {
  const firstArg = args[0];

  try {
    return firstArg.includes('open.spotify.com')
      ? await searchSpotify(firstArg, cache)
      : await searchYouTube(args, cache);
  } catch (error) {
    if (retryCount < 3) {
      retryCount++;
      console.warn(`Error searching for "${args.join(' ')}"\nRetrying... (${retryCount})\n`, error);
      return search(args, cache, retryCount);
    }
    throw error;
  }
};

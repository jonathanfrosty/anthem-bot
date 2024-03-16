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
 * Get the number of seconds from a string of the form "hours:minutes:seconds", ensuring it is within the given range.
 * For example, "1:12:42" (1hour 12minutes 42seconds).
 */
export const getSeekSeconds = (string, maxSeconds) => {
  const [secs, mins, hrs] = string.split(":").reverse()
  const seconds = secs && !Number.isNaN(+secs) ? +secs : 0;
  const minutes = mins && !Number.isNaN(+mins) ? +mins : 0;
  const hours   =  hrs && !Number.isNaN(+hrs)  ?  +hrs : 0;

  const totalSeconds = (hours * 60 * 60) + (minutes * 60) + seconds;

  if (totalSeconds < 0 || totalSeconds > maxSeconds) return null;

  return Math.min(totalSeconds, maxSeconds - 0.1);
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

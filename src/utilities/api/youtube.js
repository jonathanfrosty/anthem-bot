import yts from 'yt-search';
import { isValidUrl, mapToCache } from '../helpers.js';

/**
 * Get the playlist ID from a YouTube playlist URL.
 */
const getPlaylistID = (url) => {
  var reg = /[&?]list=([a-z0-9_]+)/i;
  var match = reg.exec(url);
  return match[1];
};

/**
 * Get the video ID from a YouTube video URL.
 */
const getVideoID = (url) => {
  var reg = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  var match = reg.exec(url);
  return match[2];
};

/**
 * Fetch track data using the YouTube API.
 */
export const searchYouTube = async (input, cache) => {
  const firstArg = input[0];

  // youtube search terms
  if (!isValidUrl(firstArg)) {
    return [(await yts(input.join(' '))).videos[0]];
  }

  let tracks = [];
  let itemId;

  // playlist
  if (firstArg.includes('list=')) {
    itemId = getPlaylistID(firstArg);

    if (await cache.has(itemId)) {
      return cache.get(itemId);
    }

    tracks = (await yts({ listId: itemId })).videos;
  } else {
    // single video
    itemId = getVideoID(firstArg);

    if (await cache.has(itemId)) {
      return cache.get(itemId);
    }

    tracks[0] = await yts({ videoId: itemId });
  }

  cache.set(itemId, mapToCache(tracks));

  return tracks;
};
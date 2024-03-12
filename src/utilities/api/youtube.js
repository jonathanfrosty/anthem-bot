import { search, video_info, playlist_info } from 'play-dl'
import { isValidUrl } from '../helpers.js';

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
 * Get the thumbnail with the highest resolution.
 */
const getBestThumbnail = (thumbnails) =>
  thumbnails.reduce((acc, cur) => {
    if (cur.width + cur.height > acc.width + acc.height) return cur;
    return acc;
  }, thumbnails[0]).url;

/**
 * Map videos with additional properties.
 */
const mapVideos = (videos) => 
  videos.map(({ url, title, durationInSec, thumbnails}) => ({
    url,
    title,
    durationInSec,
    thumbnail: getBestThumbnail(thumbnails),
  }));

/**
 * Fetch track data using the YouTube API.
 */
export const searchYouTube = async (input, cache) => {
  const firstArg = input[0];

  // youtube search terms
  if (!isValidUrl(firstArg)) {
    return mapVideos(await search(input.join(' '), { limit: 1, source: { youtube: 'video' } }));
  }

  let tracks = [];
  let itemId;

  // playlist
  if (firstArg.includes('playlist')) {
    itemId = getPlaylistID(firstArg);
    if (await cache.has(itemId)) return await cache.get(itemId);
    const { videos } = await playlist_info(firstArg);
    tracks = videos;
  } else {
    // single video
    itemId = getVideoID(firstArg);
    if (await cache.has(itemId)) return await cache.get(itemId);
    const { video_details } = await video_info(firstArg)
    tracks = [video_details];
  }

  tracks = mapVideos(tracks);
  cache.set(itemId, tracks);
  return tracks;
};
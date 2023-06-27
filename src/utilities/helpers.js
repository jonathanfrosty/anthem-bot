import yts from 'yt-search';
import SpotifyWebApi from 'spotify-web-api-node';

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

spotify.clientCredentialsGrant().then(
  (data) => spotify.setAccessToken(data.body['access_token']),
  (err) => console.warn('Something went wrong when retrieving an access token', err),
);

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
 * Get the track/playlist ID from a given Spotify URL.
 */
const getSpotifyId = (url) => {
  const items = url.split('/');
  const lastItem = items[items.length - 1];
  return lastItem.split('?')[0];
};

/**
 * Fetch the tracks in a Spotify playlist given a playlist ID.
 */
const getSpotifyPlaylistTracks = (id) =>
  spotify.getPlaylistTracks(id, {
    limit: 25,
    fields: 'items',
  });

/**
 * Fetch Spotify track data given a track ID.
 */
const getSpotifyTrack = (id) => spotify.getTrack(id);

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
 * Map track data to be cached.
 */
const mapToCache = (items) =>
  items.map(({ videoId, title, thumbnail, duration: { seconds } }) => ({
    videoId,
    title,
    thumbnail,
    duration: { seconds },
  }));

/**
 * Fetch track data using the Spotify API.
 */
const searchSpotify = async (input, cache) => {
  const itemId = getSpotifyId(input);

  if (await cache.has(itemId)) {
    return cache.get(itemId);
  }

  let tracks = [];

  if (input.includes('track')) {
    const { body } = await getSpotifyTrack(itemId);
    tracks[0] = body;
  } else if (input.includes('playlist')) {
    const { body } = await getSpotifyPlaylistTracks(itemId);
    tracks = body.items.map((item) => item.track);
  }

  const trackSearchTerms = tracks.map(({ name, artists }) => {
    const artistNames = artists.map((artist) => artist.name).join(', ');
    return `${artistNames} - ${name}`.split(' ');
  });

  const searches = trackSearchTerms.map(async (terms) => (await search(terms))[0]);
  const results = await Promise.all(searches);

  cache.set(itemId, mapToCache(results));

  return results;
};

/**
 * Fetch track data using the YouTube API.
 */
const searchYouTube = async (input, cache) => {
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

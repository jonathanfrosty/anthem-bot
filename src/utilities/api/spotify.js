import SpotifyWebApi from 'spotify-web-api-node';
import { search, mapToCache } from '../helpers.js';

let nextTokenRefreshTime;
let tokenDurationSeconds;

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

/**
 * Check if a new access token is required to use the Spotify API; if so, request a new one.
 */
const verifyCredentials = async () => {
  if (!nextTokenRefreshTime || nextTokenRefreshTime < Date.now()) {
    nextTokenRefreshTime = Date.now() + (tokenDurationSeconds - 5) * 1000;

    await requestToken();
  }
};

/**
 * Update the Spotify access token and token duration.
 */
const setTokens = (tokens) => {
  spotify.setAccessToken(tokens.access_token);
  tokenDurationSeconds = tokens.expires_in;
};

/**
 * Request a new Spotify API access token.
 */
const requestToken = async () => {
  const { body } = await spotify.clientCredentialsGrant();
  setTokens(body);
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
 * Fetch track data using the Spotify API.
 */
export const searchSpotify = async (input, cache) => {
  await verifyCredentials();

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
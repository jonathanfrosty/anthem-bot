import { v4 } from 'uuid';
import ytdl from 'discord-ytdl-core';
import { createAudioResource } from '@discordjs/voice';
import { Constants } from 'discord.js';
import { queuedEmbed, errorEmbed, playingEmbed, finishedEmbed } from '../utilities/embeds.js';

/**
 * Update a channel periodically with the elapsed time of the current song,
 * giving the effect of a real-time progress bar.
 * Once the song finishes, update the message to reflect that.
 * Abort updates if the message is deleted.
 */
const updatePlaying = async (song, channel, message) => {
  try {
    const player = channel.client.players.get(channel.guildId);
    if (player?.currentSong?.id === song.id) {
      const elapsedSeconds = player.getCurrentSongElapsedSeconds();
      const newContent = playingEmbed({ ...song, elapsedSeconds });

      message = !message
        ? await channel.send(newContent)
        : await message.edit(newContent);

      if (!message.deleted) {
        setTimeout(() => updatePlaying(song, channel, message), 5000);
      }
    } else {
      await message?.edit(finishedEmbed(song));
    }
  } catch (error) {
    if (error.code !== Constants.APIErrors.UNKNOWN_MESSAGE) {
      console.warn(error);
    }
  }
};

/**
 * Song class capable of generating an audio resource from a YouTube url.
 */
export default class Song {
  constructor({
    id, url, title, thumbnail, durationSeconds, onStart, onQueue, onError,
  }) {
    this.id = id;
    this.url = url;
    this.title = title;
    this.thumbnail = thumbnail;
    this.durationSeconds = durationSeconds;
    this.onStart = onStart;
    this.onQueue = onQueue;
    this.onError = onError;
  }

  createAudioResource(startSeconds = 0, volume) {
    const stream = ytdl(this.url, { opusEncoded: true, seek: startSeconds, filter: 'audioonly', highWaterMark: 2 ** 25 });
    const resource = createAudioResource(stream, { inlineVolume: true });
    resource.volume.setVolume(volume);
    return resource;
  }

  /**
   * Create a Song object and link its callback methods to a given text channel.
   */
  static create(video, channel) {
    const { url, title, thumbnail, durationSeconds } = video;
    const id = v4();

    return new Song({
      id,
      url,
      title,
      thumbnail,
      durationSeconds,
      onStart: () => updatePlaying({ id, url, title, thumbnail, durationSeconds }, channel),
      onQueue: (position, secondsUntil) => channel.send(queuedEmbed(url, title, thumbnail, position, secondsUntil)),
      onError: () => channel.send(errorEmbed({ message: `Failed to play \`${title}\`` })),
    });
  }
}

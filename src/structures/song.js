import { v4 } from 'uuid';
import ytdl from 'discord-ytdl-core';
import { createAudioResource } from '@discordjs/voice';
import { Constants } from 'discord.js';
import { queuedEmbed, errorEmbed, playingEmbed, finishedEmbed } from '../utilities/embeds.js';

/**
 * Song class capable of generating an audio resource from a YouTube url.
 * Assigned a channel that it will send updates to.
 */
export default class Song {
  constructor({ id, url, title, thumbnail, durationSeconds, channel }) {
    this.id = id;
    this.url = url;
    this.title = title;
    this.thumbnail = thumbnail;
    this.durationSeconds = durationSeconds;
    this.channel = channel;
    this.error = false;
  }

  createAudioResource(startSeconds, volume) {
    const stream = ytdl(this.url, { opusEncoded: true, seek: startSeconds, filter: 'audioonly', highWaterMark: 2 ** 25 });
    const resource = createAudioResource(stream, { inlineVolume: true });
    resource.volume.setVolume(volume);
    return resource;
  }

  /**
   * Update the channel periodically with the elapsed time of the current song,
   * giving the effect of a real-time progress bar.
   * Once the song finishes successfully or the player disconnects, delete the message.
   * Abort updates if the message is deleted.
   */
  async onStart(message = null) {
    try {
      const player = this.channel.client.players.get(this.channel.guildId);

      if (player?.isConnected() && player?.currentSong?.id === this.id) {
        const elapsedSeconds = player.getCurrentSongElapsedSeconds();
        const newContent = playingEmbed({ ...this, elapsedSeconds });

        message = !message
          ? await this.channel.send(newContent)
          : await message.edit(newContent);

        setTimeout(() => this.onStart(message), 5e3);
      } else {
        await message?.delete();
      }
    } catch (error) {
      if (error.code !== Constants.APIErrors.UNKNOWN_MESSAGE) {
        console.warn(error);
      }
    }
  }

  async onFinish() {
    const embed = this.error
      ? errorEmbed({ message: `Failed to play \`${this.title}\`` })
      : finishedEmbed(this.url, this.title, this.thumbnail);

    return this.channel.send(embed);
  }

  async onQueue(position, secondsUntil) {
    const embed = queuedEmbed(this.url, this.title, this.thumbnail, position, secondsUntil);
    return this.channel.send(embed);
  }

  /**
   * Create a Song object and link its callback methods to a given text channel.
   */
  static create(video, channel) {
    const { url, title, thumbnail, durationSeconds } = video;

    return new Song({
      id: v4(),
      url,
      title,
      thumbnail,
      durationSeconds,
      channel,
    });
  }
}

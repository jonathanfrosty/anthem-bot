import { v4 } from 'uuid';
import ytdl from 'discord-ytdl-core';
import { createAudioResource } from '@discordjs/voice';
import { Constants } from 'discord.js';
import { queuedEmbed, errorEmbed, playingEmbed, finishedEmbed } from '../utilities/embeds.js';
import { createActionRow } from '../utilities/buttons.js';
import { BUTTONS } from '../utilities/constants.js';

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
    this.message = null;
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
   * Stops updating if the song finishes, the message gets deleted, or the player disconnects.
   */
  async onStart() {
    try {
      const player = this.channel.client.players.get(this.channel.guildId);

      if (player?.isConnected() && player?.currentSong?.id === this.id) {
        const elapsedSeconds = player.getCurrentSongElapsedSeconds();
        const content = playingEmbed({ ...this, elapsedSeconds });

        this.message = !this.message
          ? await this.sendMessage(content)
          : await this.message.edit(content);

        setTimeout(() => this.onStart(), 5e3);
      }
    } catch (error) {
      if (error.code !== Constants.APIErrors.UNKNOWN_MESSAGE) {
        console.warn(error);
      }
    }
  }

  /**
   * Sends a message to the channel with audio control buttons.
   */
  async sendMessage(content) {
    const actionRow = createActionRow(BUTTONS.LOOP, BUTTONS.PAUSE, BUTTONS.STOP);
    return this.channel.send({ ...content, components: [actionRow] });
  }

  /**
   * Deletes the progress message and signals to the channel that the song has stopped playing, either successfully or due to an error.
   */
  async onFinish() {
    this.message?.delete().catch(() => {});

    const embed = this.error
      ? errorEmbed({ message: `Failed to play \`${this.title}\`` })
      : finishedEmbed(this.url, this.title, this.thumbnail);

    return this.channel.send(embed);
  }

  /**
   * Signals to the channel that a song has been queued, including its position in the queue and how long until it will be played.
   */
  async onQueue(position, secondsUntil) {
    const embed = queuedEmbed(this.url, this.title, this.thumbnail, position, secondsUntil);
    return this.channel.send(embed);
  }

  /**
   * Creates a Song object that is bound to a given text channel.
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

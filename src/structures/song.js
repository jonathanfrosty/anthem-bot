import { v4 } from 'uuid';
import { stream } from 'play-dl';
import { createAudioResource } from '@discordjs/voice';
import { queuedEmbed, errorEmbed, playingEmbed, finishedEmbed } from '../utilities/embeds.js';
import { createActionRow, messageButtons } from '../utilities/buttons.js';
import { BUTTONS } from '../utilities/constants.js';

/**
 * Song class capable of generating an audio resource from a YouTube url.
 * Assigned a channel that it will send updates to.
 */
export default class Song {
  constructor({ id, url, title, thumbnail, durationInSec, channel }) {
    this.id = id;
    this.url = url;
    this.title = title;
    this.thumbnail = thumbnail;
    this.durationInSec = durationInSec;
    this.channel = channel;
    this.message = null;
    this.error = false;
    this.timer = null;
  }

  async getAudioResource(startSeconds, volume) {
    const { stream: ytStream, type } = await stream(this.url, { seek: startSeconds });
    const resource = createAudioResource(ytStream, { inlineVolume: true, inputType: type });
    resource.volume.setVolume(volume);
    return resource;
  }

  /**
   * Updates the channel periodically with the elapsed time of the current song,
   * giving the effect of a real-time progress bar.
   * Stops updating if the song finishes, the message gets deleted/replaced, or the player disconnects.
   */
  async onStart(isNew = true) {
    try {
      const player = this.channel.client.players.get(this.channel.guildId);

      if (player?.isConnected() && player?.currentSong?.id === this.id) {
        if (!player.paused || isNew) {
          const elapsedSeconds = player.getCurrentSongElapsedSeconds();
          const content = playingEmbed({ ...this, elapsedSeconds });

          this.message = isNew
            ? await this.sendMessage(content, player)
            : await this.message.edit(content);
        }

        this.timer = setTimeout(() => this.onStart(false), 5e3);
      }
    } catch (error) {
      if (error.code !== 10008) { // Unknown message
        console.warn(error);
      }
    }
  }

  /**
   * Sends a progress message to the channel with audio control buttons.
   */
  async sendMessage(content, player) {
    const actionRow = createActionRow(
      messageButtons[BUTTONS.LOOP](player.looping),
      messageButtons[BUTTONS.PAUSE](player.paused),
      BUTTONS.STOP,
    );
    return this.channel.send({ ...content, components: [actionRow] });
  }

  /**
   * Deletes the progress message.
   */
  async deleteMessage() {
    try {
      clearTimeout(this.timer);
      await this.message?.delete();
    } catch (error) {
      if (error.code !== 10008) {
        console.warn(error);
      }
    }
  }

  /**
   * Signals to the channel that the song has stopped playing, either successfully or due to an error.
   */
  async onFinish() {
    this.deleteMessage();

    const embed = this.error
      ? errorEmbed({ message: `Failed to play \`${this.title}\`` })
      : finishedEmbed(this.url, this.title);

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
    return new Song({
      ...video,
      id: v4(),
      channel,
    });
  }
}

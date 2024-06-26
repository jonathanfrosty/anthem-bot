import {
  AudioPlayerStatus,
  createAudioPlayer,
  entersState,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { getSeekSeconds } from '../utilities/helpers.js';

/**
 * Player class that manages individual connections to voice channels and controls any audio playing over it.
 * One Player per voice channel.
 */
export default class Player {
  constructor(voiceConnection, guildConfig, client) {
    this.client = client;
    this.voiceConnection = voiceConnection;
    this.audioPlayer = createAudioPlayer();
    this.audioResource = null;
    this.currentSong = null;
    this.volume = guildConfig.volume;
    this.paused = false;
    this.looping = false;
    this.seeking = false;
    this.seekSeconds = 0;
    this.retryCount = 0;
    this.queue = [];

    // handle connects and disconnects experienced by the voice connection
    this.voiceConnection.on('stateChange', async (_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
          try {
            await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5e3);
          } catch {
            this.leave();
          }
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        this.stop();
      } else if (
        !this.readyLock
        && (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
      ) {
        this.readyLock = true;
        try {
          await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
        } catch {
          if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
            this.leave();
          }
        } finally {
          this.readyLock = false;
        }
      }
    });

    this.audioPlayer
      .on(AudioPlayerStatus.Idle, async (oldState) => {
        // when the player finishes playing a song
        if (oldState.status !== AudioPlayerStatus.Idle) {
          this.seekSeconds = 0;

          if (this.looping) {
            await this.play();
          } else {
            await this.currentSong.onFinish();
            this.currentSong = null;
            this.audioResource = null;
            this.retryCount = 0;
            await this.processQueue();
          }
        }
      })
      .on(AudioPlayerStatus.Playing, () => {
        if (this.seeking) {
          this.seeking = false;
        } else if (!this.looping && !this.currentSong?.message) {
          this.currentSong?.onStart();
          }
      })
      .on('error', async (error) => {
        await this.handleError(error, this.getCurrentSongElapsedSeconds());
      });

    this.voiceConnection.subscribe(this.audioPlayer);
  }

  /**
   * Return whether or not the bot is connected to a voice channel.
   */
  isConnected() {
    const { status } = this.voiceConnection.state;
    return status !== VoiceConnectionStatus.Destroyed && status !== VoiceConnectionStatus.Disconnected;
  }

  /**
   * Disconnect the bot from the voice channel, if it was connected.
   */
  leave() {
    if (this.isConnected()) {
      this.clear();
      this.audioPlayer.removeAllListeners();
      this.voiceConnection.destroy();
      return true;
    }
    return false;
  }

  /**
   * Toggles the looping state of the current song.
   */
  toggleLoop() {
    this.looping = !this.looping;
    return this.looping;
  }

  /**
   * Toggles the paused state of the current song.
   */
  togglePause() {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
      this.resume();
      return false;
    }

    this.pause();
    return true;
  }

  /**
   * Pause the current song if there is one playing.
   */
  pause() {
    this.paused = this.audioPlayer.pause();
    return this.paused;
  }

  /**
   * Resume the current song if it was paused.
   */
  resume() {
    this.paused = !this.audioPlayer.unpause();
    return this.paused;
  }

  /**
   * Return information about the current song.
   */
  nowPlaying() {
    return {
      ...this.currentSong,
      elapsedSeconds: this.getCurrentSongElapsedSeconds(),
    };
  }

  /**
   * Remove a song from the queue at a given position, provided it is valid.
   */
  remove(position) {
    if (
      position
      && !Number.isNaN(+position)
      && position > 0
      && position <= this.queue.length
    ) {
      this.queue.splice(position - 1, 1);
      this.emitQueueUpdate();
      return true;
    }
    return false;
  }

  /**
   * Skip the current song and move onto the next one in the queue by default.
   * If @param position is provided and valid, this will skip to the song at that position in the queue,
   * thereby removing all songs up to that position.
   */
  skip(position) {
    if (position) {
      if (
        !Number.isNaN(+position)
        && Number.isInteger(+position)
        && position > 0
        && position <= this.queue.length
      ) {
        this.queue = this.queue.slice(position - 1);
      } else {
        return false;
      }
    }
    return this.stop();
  }

  /**
   * Stop playing the current song.
   * This will cause the next song in the queue to be processed.
   */
  stop() {
    this.paused = false;
    this.looping = false;
    return this.audioPlayer.stop(true);
  }

  /**
   * Remove all songs from the queue.
   */
  clear() {
    this.queue = [];
    this.emitQueueUpdate();
  }

  /**
   * Go to a given timestamp in the current song, provided it is within the bounds of its duration.
   */
  async seek(value) {
    if (value && this.currentSong) {
      const seconds = getSeekSeconds(value.toString(), this.currentSong.durationInSec);

      if (seconds !== null) {
        this.seeking = true;
        this.seekSeconds = seconds;
        return await this.play(this.seekSeconds);
      }
    }
    return false;
  }

  /**
   * Set the volume of the audio resource given a percentage value.
   */
  setVolume(value) {
    if (
      value !== undefined
      && !Number.isNaN(+value)
      && value >= 0
      && value <= 100
    ) {
      this.volume = +value / 100;
      this.audioResource?.volume.setVolume(this.volume);
      return this.volume;
    }
    return null;
  }

  /**
   * Push a song onto the queue, or to the front of the queue if @param forceNext is true.
   * If the queue is empty, attempt to process the song immediately.
   */
  async enqueue(songs, forceNext) {
    let position;

    if (forceNext) {
      this.queue.unshift(...songs);
      position = 1;
    } else {
      this.queue.push(...songs);
      position = this.queue.length;
    }

    if (this.currentSong || this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      if (songs.length === 1) { // don't spam channel with multiple queued songs, e.g. playlists
        const secondsUntil = this.calculateSecondsUntil(position);
        songs[0].onQueue(position, secondsUntil);
      }
      this.emitQueueUpdate();
    } else {
      await this.processQueue();
    }
  }

  /**
   * Process the next song in the queue if there is one, and only if the audio player is inactive.
   */
  async processQueue() {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) {
      return;
    }

    this.currentSong = this.queue.shift();
    this.emitQueueUpdate();
    await this.play();
  }

  /**
   * Begin playing a song from a given timestamp.
   * Will attempt to retry in the case of any errors during this process.
   */
  async play(startSeconds = 0) {
    try {
      this.audioResource = await this.currentSong.getAudioResource(startSeconds, this.volume);
      this.audioPlayer.play(this.audioResource);
      await entersState(this.audioPlayer, AudioPlayerStatus.Playing, 5000);
      return true;
    } catch (error) {
      return await this.handleError(error, startSeconds);
    }
  }

  /**
   * Handle any errors thrown whilst attempting to play an audio resource.
   * If retries are unsuccessful, trigger an error and move onto the next song in the queue.
   */
  async handleError(error, startSeconds) {
    if (this.retryCount < 2) {
      console.warn(`Error playing "${this.currentSong?.title}"\nRetrying... (${++this.retryCount})\n`, error);
      if (startSeconds > 0) {
        return await this.seek(startSeconds);
      } else {
        return await this.play();
      }
    } else {
      this.currentSong.error = true;
      this.stop();
      return false;
    }
  }

  /**
   * Calculate the number of seconds until a song at a given position in the queue will be played.
   */
  calculateSecondsUntil(position) {
    const currentSongRemainingSeconds = this.currentSong.durationInSec - this.getCurrentSongElapsedSeconds();
    return this.queue.reduce((total, song, i) => ((i < position - 1) ? total + song.durationInSec : total), currentSongRemainingSeconds);
  }

  /**
   * Get the number of seconds that the current song has been playing for.
   */
  getCurrentSongElapsedSeconds() {
    const elapsedSeconds = (this.audioResource?.playbackDuration ?? 0) / 1000;
    return elapsedSeconds + this.seekSeconds;
  }

  /**
   * Emits an event with the current queue.
   * This is for the purpose of updating any queue messages in the text channel.
   */
  emitQueueUpdate() {
    this.client.emit('queueUpdate', this.queue);
  }
}

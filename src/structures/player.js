import {
  AudioPlayerStatus,
  createAudioPlayer,
  entersState,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice';

/**
 * Player class that manages individual connections to voice channels and controls any audio playing over it.
 * One Player per voice channel.
 */
export default class Player {
  constructor(voiceConnection, guildConfig) {
    this.voiceConnection = voiceConnection;
    this.audioPlayer = createAudioPlayer();
    this.audioResource = null;
    this.currentSong = null;
    this.volume = guildConfig.volume;
    this.seekSeconds = 0;
    this.seeking = false;
    this.queue = [];

    // handle connects and disconnects experienced by the voice connection
    this.voiceConnection.on('stateChange', async (_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
          this.voiceConnection.destroy();
        } else {
          this.voiceConnection.destroy();
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        this.stop();
      } else if (
        !this.readyLock
        && (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
      ) {
        this.readyLock = true;
        try {
          await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
        } catch {
          if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();
        } finally {
          this.readyLock = false;
        }
      }
    });

    // handle state changes of the audio player to either begin playing a song or process the next song in the queue
    this.audioPlayer.on('stateChange', (oldState, newState) => {
      if (oldState.status !== AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Idle) {
        this.currentSong = null;
        this.seekSeconds = 0;
        this.processQueue();
      } else if (oldState.status !== AudioPlayerStatus.Paused && newState.status === AudioPlayerStatus.Playing) {
        if (this.seeking) {
          this.seeking = false;
        } else {
          this.currentSong?.onStart();
        }
      }
    });

    // handle errors experienced by the audio player
    this.audioPlayer.on('error', (error) => this.handleError(error, this.getCurrentSongElapsedSeconds()));

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
      this.voiceConnection.destroy();
      return true;
    }
    return false;
  }

  /**
   * Pause the current song if there is one playing.
   */
  pause() {
    return this.audioPlayer.pause();
  }

  /**
   * Resume the current song if it was paused.
   */
  resume() {
    return this.audioPlayer.unpause();
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
      return !!this.queue.splice(position - 1, 1);
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
    this.currentSong = null;
    return this.audioPlayer.stop(true);
  }

  /**
   * Remove all songs from the queue.
   */
  clear() {
    this.queue = [];
  }

  /**
   * Go to a given timestamp in the current song, provided it is within the bounds of its duration.
   */
  seek(seconds) {
    if (
      seconds !== undefined
      && this.currentSong
      && !Number.isNaN(+seconds)
      && seconds >= 0
      && seconds < this.currentSong.durationSeconds
    ) {
      this.seeking = true;
      this.seekSeconds = +seconds;
      this.play(this.seekSeconds);
      return true;
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
  enqueue(songs, forceNext) {
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
    } else {
      this.processQueue();
    }
  }

  /**
   * Process the next song in the queue if there is one, and only if the audio player is inactive.
   */
  processQueue() {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) {
      return;
    }

    this.currentSong = this.queue.shift();
    this.play();
  }

  /**
   * Begin playing a song from a given timestamp.
   * Will attempt to retry in the case of any errors during this process.
   */
  play(startSeconds = 0, retryCount = 0) {
    try {
      this.audioResource = this.currentSong.createAudioResource(startSeconds, this.volume);
      this.audioPlayer.play(this.audioResource);
    } catch (error) {
      this.handleError(error, startSeconds, retryCount);
    }
  }

  /**
   * Handle any errors thrown whilst attempting to play an audio resource.
   * If retries are unsuccessful, trigger an error and move onto the next song in the queue.
   */
  handleError(error, startSeconds, retryCount = 0) {
    if (retryCount < 2) {
      console.warn(`Error playing ${this.currentSong?.title}\nRetrying... (${++retryCount})\n`, error);
      this.play(startSeconds, retryCount);
    } else {
      this.currentSong.onError();
      this.processQueue();
    }
  }

  /**
   * Calculate the number of seconds until a song at a given position in the queue will be played.
   */
  calculateSecondsUntil(position) {
    const currentSongRemainingSeconds = this.currentSong.durationSeconds - this.getCurrentSongElapsedSeconds();
    return this.queue.reduce((total, song, i) => ((i < position - 1) ? total + song.durationSeconds : total), currentSongRemainingSeconds);
  }

  /**
   * Get the number of seconds that the current song has been playing for.
   */
  getCurrentSongElapsedSeconds() {
    const elapsedSeconds = (this.audioResource?.playbackDuration ?? 0) / 1000;
    return elapsedSeconds + this.seekSeconds;
  }
}

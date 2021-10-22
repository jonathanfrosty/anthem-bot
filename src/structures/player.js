import {
  AudioPlayerStatus,
  createAudioPlayer,
  entersState,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice';

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

    this.audioPlayer.on('error', (error) => this.handleError(error, this.seekSeconds));

    this.voiceConnection.subscribe(this.audioPlayer);
  }

  isConnected() {
    const { status } = this.voiceConnection.state;
    return status !== VoiceConnectionStatus.Destroyed && status !== VoiceConnectionStatus.Disconnected;
  }

  leave() {
    if (this.isConnected()) {
      this.voiceConnection.destroy();
      return true;
    }
    return false;
  }

  pause() {
    return this.audioPlayer.pause();
  }

  resume() {
    return this.audioPlayer.unpause();
  }

  nowPlaying() {
    return {
      ...this.currentSong,
      elapsedSeconds: this.getCurrentSongElapsedSeconds(),
    };
  }

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

  skip(position) {
    if (position) {
      if (
        !Number.isNaN(+position)
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

  stop() {
    this.currentSong = null;
    return this.audioPlayer.stop(true);
  }

  clear() {
    this.queue = [];
  }

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

  processQueue() {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) {
      return;
    }

    this.currentSong = this.queue.shift();
    this.play();
  }

  play(startSeconds = 0, retryCount = 0) {
    try {
      this.audioResource = this.currentSong.createAudioResource(startSeconds, this.volume);
      this.audioPlayer.play(this.audioResource);
    } catch (error) {
      this.handleError(error, startSeconds, retryCount);
    }
  }

  handleError(error, startSeconds, retryCount = 0) {
    if (retryCount < 2) {
      console.warn(`Error playing ${this.currentSong?.title}\nRetrying... (${++retryCount})`);
      this.play(startSeconds, retryCount);
    } else {
      this.currentSong.onError(error);
      this.processQueue();
    }
  }

  calculateSecondsUntil(position) {
    const currentSongRemainingSeconds = this.currentSong.durationSeconds - this.getCurrentSongElapsedSeconds();
    return this.queue.reduce((total, song, i) => ((i < position - 1) ? total + song.durationSeconds : total), currentSongRemainingSeconds);
  }

  getCurrentSongElapsedSeconds() {
    const elapsedSeconds = (this.audioResource?.playbackDuration ?? 0) / 1000;
    return elapsedSeconds + this.seekSeconds;
  }
}

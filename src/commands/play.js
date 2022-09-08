import { joinVoiceChannel } from '@discordjs/voice';
import Player from '../structures/player.js';
import Song from '../structures/song.js';
import { playlistEmbed } from '../utilities/embeds.js';
import { InvalidCommandException } from '../utilities/exceptions.js';
import { search } from '../utilities/helpers.js';

export default {
  aliases: ['p', 'sr'],
  parameters: '<url | text>',
  description: 'Plays song(s).\nProvide a YouTube video/playlist URL or plain text to search YouTube for a song.',
  options: {
    requireUserConnection: true,
    requireBotConnection: false,
    requireBoundChannel: true,
    requireAudioPlaying: false,
  },
  execute: async ({ client, message, command, args, guildConfig }) => {
    const { guildId, channel, member: { voice }, content } = message;

    if (args.length > 0) {
      let player = client.players.get(guildId);

      if (!player?.isConnected()) {
        const voiceConnection = joinVoiceChannel({
          channelId: voice.channel.id,
          guildId: voice.channel.guild.id,
          adapterCreator: voice.channel.guild.voiceAdapterCreator,
        });

        player = new Player(voiceConnection, guildConfig, client);
        client.players.set(guildId, player);
      }

      const videos = await search(args);
      const songs = videos.map((video) => Song.create(video, channel));

      if (songs.length > 1) {
        await channel.send(playlistEmbed(songs));
      }

      player.enqueue(songs, false);
    } else {
      throw new InvalidCommandException(content.split(' ')[0], command.parameters, guildConfig.prefix);
    }
  },
};

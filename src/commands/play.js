import { joinVoiceChannel } from '@discordjs/voice';
import Player from '../structures/player.js';
import Song from '../structures/song.js';
import { playlistEmbed } from '../utilities/embeds.js';
import { InvalidCommandException } from '../utilities/exceptions.js';
import { search } from '../utilities/helpers.js';

export default {
  name: 'play',
  parameters: '<url | text>',
  aliases: ['p'],
  description: 'Plays song(s).\nProvide a YouTube video/playlist URL or plain text to search YouTube for a song.',
  options: {
    requireBotConnection: false,
    requireUserConnection: true,
  },
  execute: async ({ client, message, args, guildConfig }) => {
    const { guildId, channel, member: { voice } } = message;

    if (args.length > 0) {
      let player = client.players.get(guildId);

      if (!player?.isConnected()) {
        const voiceConnection = joinVoiceChannel({
          channelId: voice.channel.id,
          guildId: voice.channel.guild.id,
          adapterCreator: voice.channel.guild.voiceAdapterCreator,
        });

        player = new Player(voiceConnection, guildConfig);
        client.players.set(guildId, player);
      }

      const videos = await search(args);
      const songs = videos.map((video) => Song.create(video, channel));
      player.enqueue(songs, false);

      if (songs.length > 1) {
        await channel.send(playlistEmbed(songs));
      }
    } else {
      throw new InvalidCommandException(guildConfig.prefix);
    }
  },
};
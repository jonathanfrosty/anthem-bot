import { joinVoiceChannel } from '@discordjs/voice';
import Player from '../structures/player.js';
import Song from '../structures/song.js';
import { playlistEmbed } from '../utilities/embeds.js';
import { InvalidCommandException } from '../utilities/exceptions.js';
import { search } from '../utilities/helpers.js';

export default {
  name: 'playnext',
  parameters: '<url | text>',
  aliases: ['pn'],
  description: 'Plays song(s).\nIf there is already a song playing, the song(s) will be placed at the front of the queue.',
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
      player.enqueue(songs, true);

      if (songs.length > 1) {
        await channel.send(playlistEmbed(songs));
      }
    } else {
      throw new InvalidCommandException(guildConfig.prefix);
    }
  },
};

import { joinVoiceChannel } from '@discordjs/voice';
import Player from '../structures/player.js';
import Song from '../structures/song.js';
import { playlistEmbed } from '../utilities/embeds.js';
import { InvalidCommandException } from '../utilities/exceptions.js';
import { search } from '../utilities/helpers.js';

export default {
  aliases: ['pn'],
  parameters: '<url | text>',
  description: 'Plays song(s).\nIf there is already a song playing, the song(s) will be placed at the front of the queue.',
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

      player.enqueue(songs, true);
    } else {
      throw new InvalidCommandException(content.split(' ')[0], command.parameters, guildConfig.prefix);
    }
  },
};

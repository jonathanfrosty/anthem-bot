import { joinVoiceChannel } from '@discordjs/voice';
import Player from '../structures/player.js';
import { REACTIONS } from '../utilities/constants.js';

export default {
  aliases: ['connect'],
  description: 'Connects the bot to the user\'s voice channel.',
  options: {
    requireUserConnection: true,
    requireBotConnection: false,
    requireBoundChannel: true,
    requireAudioPlaying: false,
  },
  execute: async ({ client, message, guildConfig }) => {
    const { guildId, member: { voice: { channel } } } = message;
    const player = client.players.get(message.guildId);

    if (!player?.isConnected()) {
      const voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      client.players.set(guildId, new Player(voiceConnection, guildConfig, client));

      message.react(REACTIONS.JOY);
    }
  },
};

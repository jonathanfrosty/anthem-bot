import { commandsEmbed } from '../utilities/embeds.js';

export default {
  aliases: ['commands'],
  description: 'Displays a list of supported commands with their descriptions and any aliases.',
  options: {
    requireUserConnection: false,
    requireBotConnection: false,
    requireBoundChannel: true,
    requireAudioPlaying: false,
  },
  execute: async ({ client, message, guildConfig }) => {
    const embed = commandsEmbed(client.commands, guildConfig.prefix);
    message.channel.send(embed);
  },
};

import { commandsEmbed } from '../utilities/embeds.js';

export default {
  aliases: ['commands'],
  description: 'Displays a list of supported commands with their descriptions and any aliases.',
  options: {
    requireBotConnection: false,
    requireUserConnection: false,
    requireBoundChannel: true,
  },
  execute: async ({ client, message, guildConfig }) => {
    const embed = commandsEmbed(client.commands, guildConfig.prefix);
    message.channel.send(embed);
  },
};

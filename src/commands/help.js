import { commandsEmbed } from '../utilities/embeds.js';

export default {
  name: 'help',
  aliases: ['commands'],
  description: 'Displays a list of supported commands with their descriptions and any aliases.',
  options: {
    requireBotConnection: false,
    requireUserConnection: false,
  },
  execute: async ({ client, message, guildConfig }) => {
    const embed = commandsEmbed(client.commands, guildConfig.prefix);
    message.channel.send(embed);
  },
};

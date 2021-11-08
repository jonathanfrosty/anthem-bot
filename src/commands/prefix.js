import { REACTIONS } from '../utilities/constants.js';
import { InvalidCommandException } from '../utilities/exceptions.js';

export default {
  aliases: ['pre'],
  parameters: '<characters>',
  description: 'Sets the prefix for all commands.',
  options: {
    requireUserConnection: false,
    requireBotConnection: false,
    requireBoundChannel: true,
    requireAudioPlaying: false,
  },
  execute: async ({ client, message, command, args, guildConfig }) => {
    if (args.length > 0) {
      const prefix = args[0].toString();
      client.db.set(message.guildId, { ...guildConfig, prefix });
      message.react(REACTIONS.OK);
    } else {
      throw new InvalidCommandException(message.content.split(' ')[0], command.parameters, guildConfig.prefix);
    }
  },
};

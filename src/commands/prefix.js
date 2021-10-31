import { REACTIONS } from '../utilities/constants.js';
import { InvalidCommandException } from '../utilities/exceptions.js';

export default {
  name: 'prefix',
  parameters: '<characters>',
  aliases: ['pre'],
  description: 'Sets the prefix for all commands.',
  options: {
    requireBotConnection: false,
    requireUserConnection: false,
    requireBoundChannel: true,
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

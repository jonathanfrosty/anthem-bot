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
  },
  execute: async ({ client, message, args, guildConfig }) => {
    const prefix = args[0]?.toString();

    if (prefix) {
      client.db.set(message.guildId, { ...guildConfig, prefix });
      message.react(REACTIONS.OK);
    } else {
      throw new InvalidCommandException(guildConfig.prefix);
    }
  },
};

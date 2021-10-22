import { REACTIONS } from '../utilities/constants.js';
import { InvalidCommandException } from '../utilities/exceptions.js';

export default {
  name: 'seek',
  parameters: '<seconds>',
  description: 'Moves to a time in the current song.\nProvide a number of seconds.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
  },
  execute: async ({ client, message, args, guildConfig }) => {
    if (args.length > 0) {
      const player = client.players.get(message.guildId);

      if (player?.seek(args[0])) {
        message.react(REACTIONS.OK);
      }
    } else {
      throw new InvalidCommandException(guildConfig.prefix);
    }
  },
};

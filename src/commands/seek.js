import { REACTIONS } from '../utilities/constants.js';
import { InvalidCommandException } from '../utilities/exceptions.js';

export default {
  parameters: '<seconds | mm:ss>',
  description: 'Moves to a time in the current song.\nProvide a number of seconds or a timestamp of the correct form.',
  options: {
    requireUserConnection: true,
    requireBotConnection: true,
    requireBoundChannel: true,
    requireAudioPlaying: true,
  },
  execute: async ({ client, message, command, args, guildConfig }) => {
    if (args.length > 0) {
      const player = client.players.get(message.guildId);

      if (player.seek(args[0])) {
        message.react(REACTIONS.OK);
      }
    } else {
      throw new InvalidCommandException(message.content.split(' ')[0], command.parameters, guildConfig.prefix);
    }
  },
};

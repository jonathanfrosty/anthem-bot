import { REACTIONS } from '../utilities/constants.js';
import { InvalidCommandException } from '../utilities/exceptions.js';

export default {
  aliases: ['delete'],
  parameters: '<position>',
  description: 'Removes the song at the given position from the queue.',
  options: {
    requireUserConnection: true,
    requireBotConnection: true,
    requireBoundChannel: true,
    requireAudioPlaying: false,
  },
  execute: async ({ client, message, command, args, guildConfig }) => {
    if (args.length > 0) {
      const player = client.players.get(message.guildId);

      if (player.remove(args[0])) {
        message.react(REACTIONS.OK);
      }
    } else {
      throw new InvalidCommandException(message.content.split(' ')[0], command.parameters, guildConfig.prefix);
    }
  },
};

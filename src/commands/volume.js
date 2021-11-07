import { DEFAULT_VOLUME, REACTIONS } from '../utilities/constants.js';
import { InvalidCommandException } from '../utilities/exceptions.js';

export default {
  aliases: ['vol'],
  parameters: '<0-100>',
  description: `Sets the volume as a percentage. Default is ${DEFAULT_VOLUME * 100}.`,
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
    requireBoundChannel: true,
  },
  execute: async ({ client, message, command, args, guildConfig }) => {
    if (args.length > 0) {
      const player = client.players.get(message.guildId);
      const volume = player.setVolume(args[0]);

      if (volume !== null) {
        client.db.set(message.guildId, { ...guildConfig, volume });
        message.react(REACTIONS.OK);
      }
    } else {
      throw new InvalidCommandException(message.content.split(' ')[0], command.parameters, guildConfig.prefix);
    }
  },
};

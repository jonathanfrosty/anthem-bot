import { Permissions } from 'discord.js';
import { REACTIONS } from '../utilities/constants.js';

export default {
  description: 'Binds the bot to a single text channel where commands can be used.\nBy default, any channel will work.',
  options: {
    requireUserConnection: false,
    requireBotConnection: false,
    requireBoundChannel: false,
    requireAudioPlaying: false,
    permissions: [Permissions.FLAGS.ADMINISTRATOR],
  },
  execute: async ({ client, message, guildConfig }) => {
    client.db.set(message.guildId, {
      ...guildConfig,
      boundChannel: message.channel.id,
    });
    message.react(REACTIONS.OK);
  },
};

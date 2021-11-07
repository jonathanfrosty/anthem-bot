import { REACTIONS } from '../utilities/constants.js';

export default {
  aliases: ['dc'],
  description: 'Disconnects the bot from the user\'s voice channel.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
    requireBoundChannel: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);

    if (player.leave()) {
      client.players.delete(message.guildId);
      message.react(REACTIONS.SAD);
    }
  },
};

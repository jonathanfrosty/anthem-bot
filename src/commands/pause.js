import { REACTIONS } from '../utilities/constants.js';

export default {
  description: 'Pauses the current song.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
    requireBoundChannel: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);

    if (player.pause()) {
      message.react(REACTIONS.OK);
    }
  },
};

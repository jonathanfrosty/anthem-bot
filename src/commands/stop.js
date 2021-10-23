import { REACTIONS } from '../utilities/constants.js';

export default {
  name: 'stop',
  description: 'Stops the current song.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
    requireBoundChannel: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);

    if (player?.stop()) {
      message.react(REACTIONS.OK);
    }
  },
};

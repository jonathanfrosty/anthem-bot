import { REACTIONS } from '../utilities/constants.js';

export default {
  name: 'clear',
  description: 'Clears the song queue.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);

    if (player) {
      player.clear();
      message.react(REACTIONS.OK);
    }
  },
};

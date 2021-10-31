import { REACTIONS } from '../utilities/constants.js';

export default {
  name: 'clear',
  description: 'Clears the song queue.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
    requireBoundChannel: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);

    player.clear();
    message.react(REACTIONS.OK);
  },
};

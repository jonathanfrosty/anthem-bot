import { REACTIONS } from '../utilities/constants.js';

export default {
  aliases: ['unpause'],
  description: 'Resumes the current song.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
    requireBoundChannel: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);

    if (player.resume()) {
      message.react(REACTIONS.OK);
    }
  },
};

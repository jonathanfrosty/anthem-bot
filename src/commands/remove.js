import { REACTIONS } from '../utilities/constants.js';

export default {
  name: 'remove',
  parameters: '<position>',
  aliases: ['delete'],
  description: 'Removes the song at the given position from the queue.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
  },
  execute: async ({ client, message, args }) => {
    const player = client.players.get(message.guildId);

    if (player?.remove(args[0])) {
      message.react(REACTIONS.OK);
    }
  },
};

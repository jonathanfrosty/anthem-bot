import { REACTIONS } from '../utilities/constants.js';

export default {
  aliases: ['next'],
  parameters: '[position]',
  description: 'Skips the current song.\nOptionally, provide a number to skip to the song at that position in the queue.',
  options: {
    requireUserConnection: true,
    requireBotConnection: true,
    requireBoundChannel: true,
    requireAudioPlaying: true,
  },
  execute: async ({ client, message, args }) => {
    const player = client.players.get(message.guildId);

    if (player.skip(args[0])) {
      message.react(REACTIONS.OK);
    }
  },
};

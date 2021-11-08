import { REACTIONS } from '../utilities/constants.js';

export default {
  description: 'Stops the current song.',
  options: {
    requireUserConnection: true,
    requireBotConnection: true,
    requireBoundChannel: true,
    requireAudioPlaying: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);

    if (player.stop()) {
      message.react(REACTIONS.OK);
    }
  },
};

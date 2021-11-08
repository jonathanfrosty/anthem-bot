import { REACTIONS } from '../utilities/constants.js';

export default {
  description: 'Clears the song queue.',
  options: {
    requireUserConnection: true,
    requireBotConnection: true,
    requireBoundChannel: true,
    requireAudioPlaying: false,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);

    player.clear();
    message.react(REACTIONS.OK);
  },
};

import { REACTIONS } from '../utilities/constants.js';

export default {
  name: 'volume',
  parameters: '<0-100>',
  aliases: ['vol'],
  description: 'Sets the volume as a percentage.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
  },
  execute: async ({ client, message, args, guildConfig }) => {
    const { guildId } = message;
    const player = client.players.get(guildId);
    const volume = player?.setVolume(args[0]);

    if (volume !== null) {
      client.db.set(guildId, { ...guildConfig, volume });
      message.react(REACTIONS.OK);
    }
  },
};

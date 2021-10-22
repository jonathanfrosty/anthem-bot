import { playingEmbed } from '../utilities/embeds.js';

export default {
  name: 'nowplaying',
  aliases: ['np'],
  description: 'Displays the current song.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);

    if (player?.currentSong) {
      const embed = playingEmbed({ ...player.currentSong, showDuration: false });
      message.channel.send(embed);
    }
  },
};

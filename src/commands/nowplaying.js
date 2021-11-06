export default {
  name: 'nowplaying',
  aliases: ['np'],
  description: 'Displays the current song.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
    requireBoundChannel: true,
  },
  execute: async ({ client, message }) => {
    const { currentSong } = client.players.get(message.guildId);

    if (currentSong) {
      await currentSong.deleteMessage();
      await currentSong.onStart();
    }
  },
};

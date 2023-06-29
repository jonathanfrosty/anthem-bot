export default {
  aliases: ['np', 'song', 'currentsong', 'currentfuckingsong', 'givemethecurrentsongrightfuckingnowpeasant'],
  description: 'Displays the current song.',
  options: {
    requireUserConnection: true,
    requireBotConnection: true,
    requireBoundChannel: true,
    requireAudioPlaying: true,
  },
  execute: async ({ client, message }) => {
    const { currentSong } = client.players.get(message.guildId);

    if (currentSong) {
      await currentSong.deleteMessage();
      await currentSong.onStart();
    }
  },
};

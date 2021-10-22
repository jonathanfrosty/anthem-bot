export default async (client, oldState, newState) => {
  const { member, channelId, guild } = oldState;

  if (!member.user.bot && channelId && !newState.channelId) { // user left
    const { members } = client.channels.cache.get(channelId);

    if (members.size === 1 && members.get(client.user.id)) { // check if only Anthem is in the voice channel
      client.players.get(guild.id)?.leave();
    }
  }
};

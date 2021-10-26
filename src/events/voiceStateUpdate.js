/**
 * Event handler for when any voice state update occurs within a voice channel.
 * Used to disconnect the bot from a voice channel in the event that there are no other users in it.
 */
export default async (client, oldState, newState) => {
  const { member, channelId, guild } = oldState;

  if (!member.user.bot && channelId && newState.channelId !== channelId) { // user left
    const { members } = client.channels.cache.get(channelId);

    if (members.size === 1 && members.get(client.user.id)) { // check if only Anthem is in the voice channel
      client.players.get(guild.id)?.leave();
    }
  }
};

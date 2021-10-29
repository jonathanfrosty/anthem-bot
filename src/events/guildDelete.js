/**
 * Event handler for deleting a guild's store data when the bot is removed from it.
 */
export default async (client, guild) => {
  client.db.delete(guild.id);
};

/**
 * Event handler for indicating when the bot becomes ready to use.
 */
export default async (client) => {
  console.log(`Ready!\nServers: ${client.guilds.cache.size}\nUsers: ${client.users.cache.size}`);
};

/**
 * Event handler for indicating when the bot becomes ready to use.
 */
export default async (client) => {
  client.user.setActivity('certified bangers');
  console.log(`Ready!\nServers: ${client.guilds.cache.size}\nUsers: ${client.users.cache.size}`);
};

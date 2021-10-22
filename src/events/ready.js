export default async (client) => {
  client.user.setActivity('certified bangers');
  console.log(`Ready!\nServers: ${client.guilds.cache.size}\nUsers: ${client.users.cache.size}`);
};

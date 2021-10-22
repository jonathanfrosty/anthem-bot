import { anthemEmbed } from '../utilities/embeds.js';

export default async (client, guild) => {
  const channel = guild.channels.cache.find((c) => c.isText() && c.permissionsFor(client.user).has(Permissions.FLAGS.SEND_MESSAGES));
  channel?.send(anthemEmbed());
};

import { anthemEmbed } from '../utilities/embeds.js';

/**
 * Event handler for sending a message to the first viable text channel of a server when the bot is added to it.
 */
export default async (client, guild) => {
  const channel = guild.channels.cache.find((c) => c.isText() && c.permissionsFor(client.user).has(Permissions.FLAGS.SEND_MESSAGES));
  channel?.send(anthemEmbed());
};

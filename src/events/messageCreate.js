import { DEFAULT_PREFIX, DEFAULT_VOLUME, REACTIONS } from '../utilities/constants.js';
import { errorEmbed } from '../utilities/embeds.js';
import { BotNotConnectedException, UserNotConnectedException } from '../utilities/exceptions.js';

const getCommand = (client, firstArg, prefix) => {
  if (!firstArg.startsWith(prefix)) return null;

  const command = firstArg.substr(prefix.length).toLowerCase();
  return client.commands.get(command) || client.commands.find((cmd) => cmd.aliases?.includes(command));
};

const getGuildConfig = async (client, guildId) => {
  if (!await client.db.has(guildId)) {
    await client.db.set(guildId, {
      prefix: DEFAULT_PREFIX,
      volume: DEFAULT_VOLUME,
    });
  }

  return client.db.get(guildId);
};

export default async (client, message) => {
  const { content, guildId, channel, member: { user, voice } } = message;

  if (user.bot) return;

  try {
    const [firstArg, ...args] = content.split(' ');
    const guildConfig = await getGuildConfig(client, guildId);
    const command = getCommand(client, firstArg, guildConfig.prefix);

    if (!command) return;

    if (command.options.requireUserConnection && !voice.channel) {
      throw new UserNotConnectedException();
    }

    if (command.options.requireBotConnection && !client.players.has(guildId)) {
      throw new BotNotConnectedException();
    }

    await command.execute({ client, message, args, guildConfig });
  } catch (error) {
    channel.send((errorEmbed(error)));
    message.react(REACTIONS.FAIL);
    console.warn(new Date().toLocaleTimeString(), error);
  }
};

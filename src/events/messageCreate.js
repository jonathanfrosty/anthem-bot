import { Permissions } from 'discord.js';
import { DEFAULT_PREFIX, DEFAULT_VOLUME, REACTIONS } from '../utilities/constants.js';
import { errorEmbed } from '../utilities/embeds.js';
import {
  BotNotConnectedException,
  BotPermissionsException,
  NoAudioPlayingException,
  UnboundChannelException,
  UserNotConnectedException,
  UserPermissionsException,
} from '../utilities/exceptions.js';

/**
 * Get a matching command by name or any aliases.
 */
const getCommand = (client, firstArg, prefix) => {
  if (!firstArg.startsWith(prefix)) return null;

  const command = firstArg.substr(prefix.length).toLowerCase();
  return client.commands.get(command) || client.commands.find((cmd) => cmd.aliases?.includes(command));
};

/**
 * Retrieve the store object for a given guild if it exists; otherwise, set and return a default.
 */
const getGuildConfig = async (client, guildId) => {
  if (!await client.db.has(guildId)) {
    await client.db.set(guildId, {
      prefix: DEFAULT_PREFIX,
      volume: DEFAULT_VOLUME,
      boundChannel: null,
    });
  }

  return client.db.get(guildId);
};

/**
 * Validate the bot, user, channel, and command when applicable.
 */
const validate = (client, guildConfig, command, { guildId, channel, member }) => {
  const player = client.players.get(guildId);

  // check if the bot has permission to use the text channel
  if (!channel.permissionsFor(client.user).has([Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES])) {
    throw new BotPermissionsException();
  }

  // check if the user is connected to a voice channel
  if (command.options.requireUserConnection && !member.voice.channel) {
    throw new UserNotConnectedException();
  }

  // check if the bot is connected to the user's voice channel
  if (command.options.requireBotConnection && (!player || player.voiceConnection.joinConfig.channelId !== member.voice.channel?.id)) {
    throw new BotNotConnectedException();
  }

  // check if using the bound channel
  if (command.options.requireBoundChannel && guildConfig.boundChannel !== null && guildConfig.boundChannel !== channel.id) {
    throw new UnboundChannelException(guildConfig);
  }

  // check if the user has permission to execute the command
  if (command.options.permissions && !channel.permissionsFor(member.user).has(command.options.permissions)) {
    throw new UserPermissionsException();
  }

  // check if there is currently a song playing
  if (command.options.requireAudioPlaying && player?.currentSong === null) {
    throw new NoAudioPlayingException();
  }
};

/**
 * Event handler for when any message is sent by a user.
 * If the message is a valid command, attempt to execute it.
 * Send a message back and react to the user message to indicate either success or failure.
 */
export default async (client, message) => {
  const { content, guildId, channel, member } = message;

  if (member?.user.bot) return;

  try {
    const [firstArg, ...args] = content.split(' ');
    const guildConfig = await getGuildConfig(client, guildId);
    const command = getCommand(client, firstArg, guildConfig.prefix);

    if (!command) return;

    validate(client, guildConfig, command, message);

    await command.execute({ client, message, command, args, guildConfig });
  } catch (error) {
    channel.send((errorEmbed(error)));
    message.react(REACTIONS.FAIL);
    console.warn(new Date().toUTCString(), error);
  }
};

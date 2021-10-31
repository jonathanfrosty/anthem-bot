export class InvalidCommandException {
  constructor(command, parameters, prefix) {
    this.name = 'Invalid command usage';
    this.message = `**\`${command} ${parameters}\`**\n\nType **\`${prefix}help\`** for more information.`;
  }
}

export class UserNotConnectedException {
  constructor() {
    this.name = 'User not connected';
    this.message = 'You must be connected to a voice channel to use Anthem.';
  }
}

export class BotNotConnectedException {
  constructor() {
    this.name = 'Bot not connected';
    this.message = 'Anthem must be connected to a voice channel to use this command.';
  }
}

export class UnboundChannelException {
  constructor({ prefix, boundChannel }) {
    this.name = 'Unbound channel';
    this.message = `This channel has not been bound to Anthem.\nPlease either **\`${prefix}bind\`** this channel or use <#${boundChannel}>.`;
  }
}

export class UserPermissionsException {
  constructor() {
    this.name = 'Missing user permissions';
    this.message = 'You are not permitted to execute that command.';
  }
}

export class BotPermissionsException {
  constructor() {
    this.name = 'Missing bot permissions';
    this.message = 'Anthem is not permitted to use this text channel.';
  }
}

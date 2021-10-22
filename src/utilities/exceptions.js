export function InvalidCommandException(prefix) {
  this.name = 'Invalid command usage';
  this.message = `Type **\`${prefix}help\`** for a list of supported commands.`;
}

export function UserNotConnectedException() {
  this.name = 'User not connected';
  this.message = 'You must be connected to a voice channel to use Anthem.';
}

export function BotNotConnectedException() {
  this.name = 'Anthem not connected';
  this.message = 'Anthem must be connected to a voice channel to use this command.';
}

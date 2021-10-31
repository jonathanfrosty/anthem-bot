import { BUTTONS } from '../utilities/constants.js';

/**
 * Event handler for when audio control message buttons are pressed.
 */
export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  const { customId, guildId, message } = interaction;
  const player = client.players.get(guildId);

  if (!customId.startsWith('audio')) {
    return;
  }

  // check if there is a connected player and that the source message is associated with the current song.
  // if not, delete the message.
  if (!player?.isConnected() || interaction.message.id !== player.currentSong?.message.id) {
    interaction.message.delete();
    return;
  }

  if (customId === BUTTONS.LOOP) {
    const looping = player.toggleLoop();
    interaction.component.setStyle(looping ? 'PRIMARY' : 'SECONDARY');
    interaction.component.setLabel(looping ? 'UNLOOP' : 'LOOP');
    interaction.update({ components: message.components });
  }

  if (customId === BUTTONS.PAUSE) {
    const paused = player.togglePause();
    interaction.component.setStyle(paused ? 'PRIMARY' : 'SECONDARY');
    interaction.component.setLabel(paused ? 'RESUME' : 'PAUSE');
    interaction.update({ components: message.components });
  }

  // this case doesn't require an interaction update as the message will be immediately deleted after stopping the current song
  if (customId === BUTTONS.STOP) {
    player.stop();
  }
};

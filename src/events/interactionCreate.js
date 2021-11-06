import { messageButtons } from '../utilities/buttons.js';
import { BUTTONS } from '../utilities/constants.js';

/**
 * Event handler for when audio control message buttons are pressed.
 */
export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  const { customId, guildId, message } = interaction;
  const player = client.players.get(guildId);
  let newButton;

  // check if there is a connected player and that the source message is associated with the current song.
  // if not, delete the message.
  if (!player?.isConnected() || (customId.startsWith('audio') && interaction.message.id !== player.currentSong?.message.id)) {
    interaction.message.delete();
    return;
  }

  if (customId === BUTTONS.LOOP) {
    const looping = player.toggleLoop();
    newButton = messageButtons[BUTTONS.LOOP](looping);
  }

  if (customId === BUTTONS.PAUSE) {
    const paused = player.togglePause();
    newButton = messageButtons[BUTTONS.PAUSE](paused);
  }

  // this case doesn't require an interaction update as the message will be immediately deleted after stopping the current song
  if (customId === BUTTONS.STOP) {
    player.stop();
    return;
  }

  interaction.component.setStyle(newButton.style);
  interaction.component.setLabel(newButton.label);
  interaction.update({ components: message.components });
};

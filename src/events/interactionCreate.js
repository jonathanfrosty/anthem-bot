import { createActionRow, messageButtons } from '../utilities/buttons.js';
import { BUTTONS } from '../utilities/constants.js';

/**
 * Event handler for when audio control message buttons are pressed.
 */
export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  const { customId, guildId, message } = interaction;

  if (![BUTTONS.LOOP, BUTTONS.PAUSE, BUTTONS.STOP].includes(customId)) return;

  const player = client.players.get(guildId);

  // check if there is a connected player and that the source message is associated with the current song.
  // if not, delete the message.
  if (
    !player?.isConnected() ||
    (customId.startsWith('audio') && message.id !== player.currentSong?.message.id)
  ) {
    message.delete();
    return;
  }

  let { looping, paused } = player;

  if (customId === BUTTONS.LOOP) {
    looping = player.toggleLoop();
  }

  if (customId === BUTTONS.PAUSE) {
    paused = player.togglePause();
  }

  // this case doesn't require an interaction update as the message will be immediately deleted after stopping the current song
  if (customId === BUTTONS.STOP) {
    player.stop();
    return;
  }

  const actionRow = createActionRow(
    messageButtons[BUTTONS.LOOP](looping),
    messageButtons[BUTTONS.PAUSE](paused),
    BUTTONS.STOP,
  );

  interaction.update({ components: [actionRow] });
};

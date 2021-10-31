import { BUTTONS } from '../utilities/constants.js';

/**
 * Event handler for when message buttons are pressed.
 */
export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  const { customId, guildId, message } = interaction;
  const player = client.players.get(guildId);

  if (!player) {
    interaction.update({ components: [] });
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

  if (customId === BUTTONS.STOP) {
    player.stop();
  }
};

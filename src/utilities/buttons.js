import { ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { BUTTONS } from './constants.js';

export const createActionRow = (...buttons) => {
  const components = buttons.map((button) => (typeof button === 'string' ? messageButtons[button]() : button));
  return new ActionRowBuilder().addComponents(...components);
};

export const messageButtons = {
  [BUTTONS.LOOP]: (active) => new ButtonBuilder()
    .setCustomId(BUTTONS.LOOP)
    .setLabel(active ? 'UNLOOP' : 'LOOP')
    .setStyle(active ? 'Primary' : 'Secondary'),
  [BUTTONS.PAUSE]: (active) => new ButtonBuilder()
    .setCustomId(BUTTONS.PAUSE)
    .setLabel(active ? 'RESUME' : 'PAUSE')
    .setStyle(active ? 'Primary' : 'Secondary'),
  [BUTTONS.STOP]: () => new ButtonBuilder()
    .setCustomId(BUTTONS.STOP)
    .setLabel('STOP')
    .setStyle('Danger'),
  [BUTTONS.PREVIOUS]: (disabled = true) => new ButtonBuilder()
    .setCustomId(BUTTONS.PREVIOUS)
    .setLabel('PREVIOUS')
    .setStyle('Primary')
    .setDisabled(disabled),
  [BUTTONS.NEXT]: (disabled = false) => new ButtonBuilder()
    .setCustomId(BUTTONS.NEXT)
    .setLabel('NEXT')
    .setStyle('Primary')
    .setDisabled(disabled),
};

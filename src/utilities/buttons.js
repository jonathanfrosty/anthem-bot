import { MessageActionRow, MessageButton } from 'discord.js';
import { BUTTONS } from './constants.js';

export const createActionRow = (...buttons) => {
  const components = buttons.map((button) => (typeof button === 'string' ? messageButtons[button]() : button));
  return new MessageActionRow().addComponents(...components);
};

export const messageButtons = {
  [BUTTONS.LOOP]: (active) => new MessageButton()
    .setCustomId(BUTTONS.LOOP)
    .setLabel(active ? 'UNLOOP' : 'LOOP')
    .setStyle(active ? 'PRIMARY' : 'SECONDARY'),
  [BUTTONS.PAUSE]: (active) => new MessageButton()
    .setCustomId(BUTTONS.PAUSE)
    .setLabel(active ? 'RESUME' : 'PAUSE')
    .setStyle(active ? 'PRIMARY' : 'SECONDARY'),
  [BUTTONS.STOP]: () => new MessageButton()
    .setCustomId(BUTTONS.STOP)
    .setLabel('STOP')
    .setStyle('DANGER'),
  [BUTTONS.PREVIOUS]: () => new MessageButton()
    .setCustomId(BUTTONS.PREVIOUS)
    .setLabel('PREVIOUS')
    .setStyle('PRIMARY')
    .setDisabled(true),
  [BUTTONS.NEXT]: () => new MessageButton()
    .setCustomId(BUTTONS.NEXT)
    .setLabel('NEXT')
    .setStyle('PRIMARY'),
};

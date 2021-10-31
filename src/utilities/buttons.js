import { MessageActionRow, MessageButton } from 'discord.js';
import { BUTTONS } from './constants.js';

export const createActionRow = (...buttonNames) => {
  const components = buttonNames.map((name) => buttons[name]);
  return new MessageActionRow().addComponents(...components);
};

const buttons = {
  loop: new MessageButton()
    .setCustomId(BUTTONS.LOOP)
    .setLabel('LOOP')
    .setStyle('SECONDARY'),
  pause: new MessageButton()
    .setCustomId(BUTTONS.PAUSE)
    .setLabel('PAUSE')
    .setStyle('SECONDARY'),
  stop: new MessageButton()
    .setCustomId(BUTTONS.STOP)
    .setLabel('STOP')
    .setStyle('DANGER'),
  previous: new MessageButton()
    .setCustomId(BUTTONS.PREVIOUS)
    .setLabel('PREVIOUS')
    .setStyle('PRIMARY'),
  next: new MessageButton()
    .setCustomId(BUTTONS.NEXT)
    .setLabel('NEXT')
    .setStyle('PRIMARY'),
};

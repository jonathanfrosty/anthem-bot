import { MessageActionRow, MessageButton } from 'discord.js';
import { BUTTONS } from './constants.js';

export const createActionRow = (...buttonNames) => {
  const components = buttonNames.map((name) => buttons[name]);
  return new MessageActionRow().addComponents(...components);
};

const buttons = {
  [BUTTONS.LOOP]: new MessageButton()
    .setCustomId(BUTTONS.LOOP)
    .setLabel('LOOP')
    .setStyle('SECONDARY'),
  [BUTTONS.PAUSE]: new MessageButton()
    .setCustomId(BUTTONS.PAUSE)
    .setLabel('PAUSE')
    .setStyle('SECONDARY'),
  [BUTTONS.STOP]: new MessageButton()
    .setCustomId(BUTTONS.STOP)
    .setLabel('STOP')
    .setStyle('DANGER'),
  [BUTTONS.PREVIOUS]: new MessageButton()
    .setCustomId(BUTTONS.PREVIOUS)
    .setLabel('PREVIOUS')
    .setStyle('PRIMARY')
    .setDisabled(true),
  [BUTTONS.NEXT]: new MessageButton()
    .setCustomId(BUTTONS.NEXT)
    .setLabel('NEXT')
    .setStyle('PRIMARY'),
};

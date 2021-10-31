import { createActionRow } from '../utilities/buttons.js';
import { BUTTONS } from '../utilities/constants.js';
import { queueEmbeds } from '../utilities/embeds.js';

export default {
  name: 'queue',
  aliases: ['q', 'songs'],
  description: 'Displays all songs in the queue.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
    requireBoundChannel: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);
    const embeds = queueEmbeds(player.queue);
    showQueue(embeds, message.channel);
  },
};

/**
 * Send a message to a channel displaying a paginated queue that users can click through for a short time.
 */
const showQueue = async (embeds, channel) => {
  let page = 0;

  if (embeds.length === 1) {
    channel.send({ embeds: [embeds[0]] });
  } else {
    let actionRow = createActionRow(BUTTONS.PREVIOUS, BUTTONS.NEXT);
    actionRow.components.at(0).setDisabled(true);
    const message = await channel.send({ embeds: [embeds[0]], components: [actionRow] });

    const filter = (i) => i.customId === BUTTONS.PREVIOUS || i.customId === BUTTONS.NEXT;
    const collector = message.createMessageComponentCollector({ filter, time: 5e3 });

    collector.on('collect', async (interaction) => {
      actionRow = createActionRow(BUTTONS.PREVIOUS, BUTTONS.NEXT);

      if (interaction.customId === BUTTONS.PREVIOUS && --page === 0) {
        actionRow.components.at(0).setDisabled(true);
      }

      if (interaction.customId === BUTTONS.NEXT && ++page === embeds.length - 1) {
        actionRow.components.at(1).setDisabled(true);
      }

      await interaction.update({ embeds: [embeds[page]], components: [actionRow] });
    });
  }
};

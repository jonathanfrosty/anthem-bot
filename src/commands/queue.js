import { createActionRow, messageButtons } from '../utilities/buttons.js';
import { BUTTONS } from '../utilities/constants.js';
import { queueEmbeds } from '../utilities/embeds.js';

export default {
  aliases: ['q', 'songs'],
  description: 'Displays all songs in the queue.',
  options: {
    requireUserConnection: true,
    requireBotConnection: true,
    requireBoundChannel: true,
    requireAudioPlaying: false,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);
    showQueue(message.channel, player.queue);
  },
};

/**
 * Send a message to a channel displaying a paginated queue that users can click through for a short time.
 */
const showQueue = async (channel, queue, message = null) => {
  let page = 0;
  let collector = null;
  const embeds = queueEmbeds(queue);

  if (embeds.length === 1) {
    message = message
      ? await message.edit({ embeds: [embeds[0]], components: [] })
      : await channel.send({ embeds: [embeds[0]] });
  } else {
    const actionRow = createActionRow(BUTTONS.PREVIOUS, BUTTONS.NEXT);

    message = message
      ? await message.edit({ embeds: [embeds[0]], components: [actionRow] })
      : await channel.send({ embeds: [embeds[0]], components: [actionRow] });

    const filter = (i) => i.customId === BUTTONS.PREVIOUS || i.customId === BUTTONS.NEXT;
    collector = message.createMessageComponentCollector({ filter, time: 5 * 60e3 });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === BUTTONS.PREVIOUS) {
        page--;
      } else if (interaction.customId === BUTTONS.NEXT) {
        page++;
      }

      const updatedActionRow = createActionRow(
        messageButtons[BUTTONS.PREVIOUS](page === 0),
        messageButtons[BUTTONS.NEXT](page === embeds.length - 1)
      );

      await interaction.update({ embeds: [embeds[page]], components: [updatedActionRow] });
    });
  }

  // if the queue gets updated, call this function again to update the queue message.
  // if the queue has become empty, delete the queue message.
  channel.client.once('queueUpdate', async (newQueue) => {
    collector?.stop();
    try {
      if (newQueue.length > 0) {
        await showQueue(channel, newQueue, message);
      } else {
        await message?.delete();
      }
    } catch (error) {
      if (error.code !== 10008) {
        console.warn(error);
      }
    }
  });
};

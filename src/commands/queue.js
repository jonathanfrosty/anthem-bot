import { REACTIONS } from '../utilities/constants.js';
import { listEmbeds } from '../utilities/embeds.js';

export default {
  name: 'queue',
  aliases: ['q', 'songs'],
  description: 'Displays all songs in the queue.',
  options: {
    requireBotConnection: true,
    requireUserConnection: true,
  },
  execute: async ({ client, message }) => {
    const player = client.players.get(message.guildId);
    showList('Queue', player?.queue, message.channel);
  },
};

const showList = async (title, queue, channel) => {
  let page = 0;

  const embeds = listEmbeds(title, queue);
  const message = await channel.send({ embeds: [embeds[0]] });

  if (embeds.length > 1) {
    message.react(REACTIONS.LEFT);
    message.react(REACTIONS.RIGHT);

    const filter = (reaction, user) => !user.bot && (reaction.emoji.name === REACTIONS.LEFT || reaction.emoji.name === REACTIONS.RIGHT);
    const collector = message.createReactionCollector({ filter, time: 60e3 });

    collector.on('collect', (reaction, user) => {
      reaction.users.remove(user.id);
      if (reaction.emoji.name === REACTIONS.LEFT && page > 0) {
        message.edit({ embeds: [embeds[--page]] });
      } else if (reaction.emoji.name === REACTIONS.RIGHT && page < embeds.length - 1) {
        message.edit({ embeds: [embeds[++page]] });
      }
    });

    collector.on('end', () => {
      message?.reactions.removeAll();
    });
  }
};
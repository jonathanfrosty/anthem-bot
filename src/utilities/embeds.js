import { Collection, MessageEmbed } from 'discord.js';
import { COMMANDS_ORDER, DEFAULT_PREFIX, PAGE_SIZE } from './constants.js';
import { formatTime, getProgressBar } from './helpers.js';

export const playingEmbed = ({ url, title, thumbnail, durationSeconds, elapsedSeconds }) => {
  if (!url) {
    return { embeds: [createEmbed({ colour: 'ORANGE', title: '❌   Nothing is currently playing' })] };
  }

  const description = `[${title}](${url})`;
  const fields = [{ name: 'Duration', value: getProgressBar(elapsedSeconds, durationSeconds) }];
  return { embeds: [createEmbed({ title: '🎵   Now playing', description, thumbnail, fields })] };
};

export const finishedEmbed = (url, title) => ({
  embeds: [
    createEmbed({ colour: 'GREEN', url, title: `✅   ${title}` }),
  ],
});

export const queuedEmbed = (url, title, thumbnail, position, secondsUntil) => {
  const description = `[${title}](${url})`;
  const fields = [
    { name: 'Position', value: `\`${position}\``, inline: true },
    { name: 'Time until', value: `\`${formatTime(secondsUntil)}\``, inline: true },
  ];
  return { embeds: [createEmbed({ colour: 'BLURPLE', title: '🎵   Added to queue', description, thumbnail, fields })] };
};

export const playlistEmbed = (songs) => {
  const songList = songs.slice(0, PAGE_SIZE).map(({ title, url }) => `[${title}](${url})`).join('\n');
  const description = songs.length > PAGE_SIZE ? `${songList}\n...and ${songs.length - PAGE_SIZE} more` : songList;
  const fields = [
    { name: 'Total duration', value: `\`${formatTime(songs.reduce((total, video) => total + video.durationSeconds, 0))}\`` },
  ];

  return {
    embeds: [
      createEmbed({
        colour: 'BLURPLE',
        title: `🎶   Playlist of ${songs.length} songs added`,
        description,
        thumbnail: songs[0].thumbnail,
        fields,
      }),
    ],
  };
};

export const errorEmbed = ({ name = 'An error occurred', message }) => ({
  embeds: [
    createEmbed({
      colour: 'RED',
      title: `⚠️   ${name}`,
      description: message ?? 'Failed to play audio.',
    }),
  ],
});

export const queueEmbeds = (items = []) => {
  const title = 'Queue';

  if (items.length === 0) {
    return [createEmbed({ colour: 'PURPLE', title: `🎶   ${title}`, description: `${title} is empty.` })];
  }

  const pages = Math.ceil(items.length / PAGE_SIZE);
  const embeds = [];

  const totalDuration = items.reduce((acc, cur) => acc + cur.durationSeconds, 0);
  const totalTime = formatTime(totalDuration);

  for (let page = 0; page < pages; page++) {
    const pageStart = page * PAGE_SIZE;
    const description = items
      .slice(pageStart, pageStart + PAGE_SIZE)
      .map((item, index) => `**${pageStart + index + 1}**. [${item.title}](${item.url})\nDuration \`${formatTime(item.durationSeconds)}\``)
      .join('\n\n');

    embeds.push(createEmbed({
      colour: 'PURPLE',
      title: `🎶   ${title}`,
      description,
      footer: `Page ${page + 1}/${pages} - ${items.length} song${items.length > 1 ? 's' : ''} - ${totalTime}`,
    }));
  }

  return embeds;
};

export const commandsEmbed = (commandsCollection, prefix) => {
  const fields = Array.from(commandsCollection)
    .sort(([nameA], [nameB]) => COMMANDS_ORDER.indexOf(nameA) - COMMANDS_ORDER.indexOf(nameB))
    .reduce((all, [name, { parameters, aliases, description }], i, arr) => {
      if (!COMMANDS_ORDER.includes(name)) return all;

      const aliasesText = aliases?.map((alias) => `\t\`${prefix + alias}\``).join('') ?? '';
      const paramsText = parameters ? ` ${parameters}` : '';

      return [...all, {
        name: `\`${prefix + name + paramsText}\`${aliasesText}`,
        value: i === arr.length - 1 ? description : description + '\n\u200b',
        key: name,
      }];
    }, []);

  return { embeds: [createEmbed({ colour: 'AQUA', title: '📝   Commands', fields })] };
};

export const anthemEmbed = () => ({
  embeds: [
    createEmbed({
      colour: '#e34234',
      title: '🎵   Anthem has joined!   🎵',
      description: `
        Anthem is a simple bot for playing YouTube and Spotify audio.\n
        Check out the source code or report any issues [here](https://github.com/jonathanfrosty/anthem-bot).\n
        Type **\`${DEFAULT_PREFIX}help\`** for a list of supported commands.
      `,
    }),
  ],
});

const createEmbed = ({ colour = 'BLUE', title, url, description = '', thumbnail, fields = [], footer = '' }) => new MessageEmbed()
  .setColor(colour)
  .setTitle(title)
  .setURL(url)
  .setDescription(description)
  .setThumbnail(thumbnail)
  .addFields(fields)
  .setFooter({ text: footer });

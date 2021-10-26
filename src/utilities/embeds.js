import { MessageEmbed } from 'discord.js';
import { COMMANDS_ORDER, DEFAULT_PREFIX, PAGE_SIZE } from './constants.js';
import { formatTime, getProgressBar } from './helpers.js';

export const playingEmbed = ({ url, title, thumbnail, durationSeconds, elapsedSeconds, showDuration = true }) => {
  if (!url) {
    return { embeds: [createEmbed({ colour: 'ORANGE', title: '❌   Nothing is currently playing' })] };
  }

  const description = `[${title}](${url})`;
  const fields = showDuration
    ? [{ name: 'Duration', value: getProgressBar(elapsedSeconds, durationSeconds) }]
    : [];
  return { embeds: [createEmbed({ title: '🎵   Now playing', description, thumbnail, fields })] };
};

export const finishedEmbed = (url, title, thumbnail) => {
  const description = `[${title}](${url})`;
  return { embeds: [createEmbed({ colour: 'GREEN', title: '✅   Finished playing', description, thumbnail })] };
};

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
        title: `🎶   Playlist of ${songs.length} songs`,
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

export const listEmbeds = (items = []) => {
  const title = 'Queue';

  if (items.length === 0) {
    return [createEmbed({ colour: 'PURPLE', title: `🎶   ${title}`, description: `${title} is empty.` })];
  }

  const pages = Math.ceil(items.length / PAGE_SIZE);
  const embeds = [];

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
      footer: `Page ${page + 1}/${pages} - ${items.length} song${items.length > 1 ? 's' : ''}`,
    }));
  }

  return embeds;
};

export const commandsEmbed = (collection, prefix) => {
  const commands = collection.sort((a, b) => COMMANDS_ORDER.indexOf(a.name) - COMMANDS_ORDER.indexOf(b.name)).values();
  const fields = Array.from(commands, ({ name, parameters, aliases, description }) => {
    const aliasesText = aliases?.map((alias) => `\t\`${prefix + alias}\``).join('') ?? '';
    const paramsText = parameters ? ` ${parameters}` : '';
    return {
      name: `\`${prefix + name + paramsText}\`${aliasesText}`,
      value: description,
    };
  });
  return { embeds: [createEmbed({ colour: 'AQUA', title: 'ℹ   Commands', fields })] };
};

export const anthemEmbed = () => ({
  embeds: [
    createEmbed({
      colour: '#e34234',
      title: '🎵   Anthem has joined!   🎵',
      description: `Anthem is a simple bot for playing YouTube audio.\n\nType **\`${DEFAULT_PREFIX}help\`** for a list of supported commands.`,
    }),
  ],
});

const createEmbed = ({ colour = 'BLUE', title, description = '', thumbnail = '', fields = [], footer = '' }) => new MessageEmbed()
  .setColor(colour)
  .setTitle(title)
  .setDescription(description)
  .setThumbnail(thumbnail)
  .addFields(fields)
  .setFooter(footer);

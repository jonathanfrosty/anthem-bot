import 'dotenv/config';
import fs from 'fs';
import Jsoning from 'jsoning';
import { Client, Intents, Collection } from 'discord.js';

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

client.db = new Jsoning('store.json');
client.commands = new Collection();
client.players = new Collection();

const commandsDir = './src/commands';
const eventsDir = './src/events';

// register commands
fs.readdirSync(commandsDir)
  .filter((file) => file.endsWith('.js'))
  .forEach(async (file) => {
    const { default: command } = await import(`${commandsDir}/${file}`);
    client.commands.set(file.split('.')[0], command);
  });

// register events
fs.readdirSync(eventsDir)
  .filter((file) => file.endsWith('.js'))
  .forEach(async (file) => {
    const { default: event } = await import(`${eventsDir}/${file}`);
    client.on(file.split('.')[0], event.bind(null, client));
  });

client.login(process.env.BOT_TOKEN);

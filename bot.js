const dotenv = require("dotenv").config();
const { Telegraf } = require("telegraf");
const { parse } = require("spotify-uri");

const { default: mongoose } = require("mongoose");
const musicHandler = require("./utils/musicHandler");

const bot = new Telegraf(process.env.BOT_TOKEN);

const db = mongoose.connect(process.env.DB_LOCAL).then(() => {
    console.log("Connection to local DB was successful");
});

bot.telegram.setMyCommands([
    {
        command: "start",
        description: "Start the bot",
    },
    {
        command: "help",
        description: "How to use the bot",
    },
]);
bot.start(async (ctx) => {
    await ctx.reply(
        "Welcome to spotify bot. Send me an spotify link to receive the files.\nTracks, Albums and Playlists are supported"
    );
});

bot.command("help", async (ctx) => {
    await ctx.reply(
        "To get songs from spotify go to spotify app or web app find the song/playlist/album you want to download click on share  copy to clipboard then simply paste the link in this chat to get the file or files."
    );
});

bot.telegram.setMyDescription("A simple bot to get Songs from spotify link");

bot.botInfo = "A simple bot to get Songs from spotify link";

bot.on("message", async (ctx) => {
    let link = ctx.text;
    if (link.startsWith("open") || link.startsWith("play"))
        link = "https://" + link;

    let parsed;
    try {
        parsed = parse(link);
    } catch {
        ctx.reply("Please provide a valid link.");
        return;
    }

    ctx.reply("Please be patient...");

    if (parsed.type === "track") {
        musicHandler.handleTrack(parsed.id, ctx);
    } else if (parsed.type === "album") {
        musicHandler.handleAlbum(parsed.id, ctx);
    } else {
        musicHandler.handlePlaylist(parsed.id, ctx);
    }
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

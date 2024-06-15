const dotenv = require("dotenv").config();
const { Telegraf, Input } = require("telegraf");
const { parse } = require("spotify-uri");
const spottydl = require("spottydl");
const fs = require("fs/promises");
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply("Hey there");
});

async function handleTrack(ctx, link) {
    console.log(ctx);

    const track = await spottydl.getTrack(link);
    console.log(track);

    let file = await spottydl.downloadTrack(track);
    file = file[0];
    console.log(file);

    if (file.status === "Success") {
        console.log("nice");

        ctx.replyWithAudio(Input.fromLocalFile(file.filename));
        await fs.rm(file.filename);
    }
}

async function handleAlbum(ctx, link) {
    const album = await spottydl.getAlbum(link);
    const files = await spottydl.downloadAlbum(album);
    console.log(files);

    files.forEach((file) => {
        if (file.status === "Success") {
            ctx.replyWithAudio(Input.fromLocalFile(file.filename));
        }
    });
}

async function handlePlaylist(ctx, link) {
    const playlist = spottydl.getPlaylist(link);
    const files = await spottydl.downloadPlaylist(playlist);
    console.log(files);
    files.forEach((file) => {
        if (file.status === "Success") {
            ctx.replyWithAudio(Input.fromLocalFile(file.filename));
        }
    });
}

bot.on("message", async (ctx) => {
    const link = ctx.text;
    let parsed;
    try {
        parsed = parse(link);
    } catch {
        ctx.reply("Please provide a valid link.");
        return;
    }

    ctx.reply("wait..");
    console.log(parsed);

    if (parsed.type === "track") {
        handleTrack(ctx, link);
    }

    if (parsed.type === "album") {
        handleAlbum(ctx, link);
    }
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

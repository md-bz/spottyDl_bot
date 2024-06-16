const dotenv = require("dotenv").config();
const { Telegraf, Input, Telegram } = require("telegraf");
const { parse } = require("spotify-uri");
const spottydl = require("spottydl");
const fs = require("fs/promises");
const { default: mongoose } = require("mongoose");
const { createMusicCache, getMusicCache } = require("./musicCacheController");
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

async function sendAndCacheTrack(ctx, track) {
    let file = await spottydl.downloadTrack(track);
    file = file[0];

    if (file.status !== "Success") {
        // #TODO: retry or do sth else
        return ctx.reply(`Failed downloading ${track.title}`);
    }
    const channelMessage = await ctx.telegram.sendAudio(
        process.env.BACKUP_CHANNEL,
        Input.fromLocalFile(file.filename)
    );

    const fileId = channelMessage.audio.file_id;

    await ctx.replyWithAudio(fileId);

    await createMusicCache(track.title, track.artist, fileId);

    await fs.rm(file.filename);
}

async function handleTrack(ctx, link) {
    const track = await spottydl.getTrack(link);

    const cache = await getMusicCache(track.title, track.artist);
    if (cache) {
        return await ctx.replyWithAudio(cache.fileId);
    }

    await sendAndCacheTrack(ctx, track);
}

async function handleAlbum(ctx, link) {
    const album = await spottydl.getAlbum(link);

    for (let i = 0; i < album.tracks.length; i++) {
        const albumTrack = album.tracks[i];
        const cache = await getMusicCache(albumTrack.title, album.artist);
        if (cache) {
            await ctx.replyWithAudio(cache.fileId);
            await ctx.reply(`${i + 1} of ${playlist.trackCount} is done.`);
            continue;
        }
        const track = {
            title: albumTrack.title,
            artist: album.artist,
            year: album.year,
            album: album.name,
            id: albumTrack.id,
            albumCoverURL: album.albumCoverURL,
            trackNumber: albumTrack.trackNumber,
        };

        await sendAndCacheTrack(ctx, track);
        await ctx.reply(`${i + 1} of ${playlist.trackCount} is done.`);
    }
}

async function handlePlaylist(ctx, link) {
    const playlist = await spottydl.getPlaylist(link);
    for (let i = 0; i < playlist.tracks.length; i++) {
        const track = playlist.tracks[i];

        const cache = await getMusicCache(track.title, track.artist);
        if (cache) {
            await ctx.replyWithAudio(cache.fileId);
            await ctx.reply(`${i + 1} of ${playlist.trackCount} is done.`);
            continue;
        }
        await sendAndCacheTrack(ctx, track);
        await ctx.reply(`${i + 1} of ${playlist.trackCount} is done.`);
    }
}

bot.on("message", async (ctx) => {
    const link = ctx.text;
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
        handleTrack(ctx, link);
    } else if (parsed.type === "album") {
        handleAlbum(ctx, link);
    } else {
        handlePlaylist(ctx, link);
    }
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

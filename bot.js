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
    // #TODO change the parser to sth better
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

bot.on("inline_query", async (ctx) => {
    try {
        const query = ctx.inlineQuery.query.trim();
        if (!query || query.length === 0) {
            const songs = await musicHandler.getTopSongs();

            const result = songs.map((song) => {
                return {
                    type: "audio",
                    id: song.track.id,
                    title: song.track.name,
                    audio_url: song.track.href,
                    performer: song.track.artists
                        .map((artist) => artist.name)
                        .join(", "),
                    audio_duration: (song.track.duration_ms / 1000).toFixed(),
                    input_message_content: { message_text: song.track.uri },
                };
            });

            return await ctx.answerInlineQuery(result, {
                cache_time: 24 * 60 * 60,
            });
        }

        const songs = await musicHandler.search(query);

        if (!songs || songs.length === 0) {
            return await ctx.answerInlineQuery(
                [
                    {
                        type: "article",
                        id: "no-songs",
                        title: "No Songs Found.",
                        description: "No Songs found.",
                        input_message_content: {
                            message_text: "No Songs found.",
                        },
                    },
                ],
                { cache_time: 0 }
            );
        }

        const result = songs.map((song) => {
            return {
                type: "audio",
                id: song.id,
                title: song.name,
                audio_url: song.href,
                performer: song.artists.map((artist) => artist.name).join(", "),
                audio_duration: (song.duration_ms / 1000).toFixed(),
                input_message_content: { message_text: song.uri },
            };
        });

        await ctx.answerInlineQuery(result, {
            cache_time: 0,
        });
    } catch (error) {
        console.error(error);
        return await ctx.answerInlineQuery(
            [
                {
                    type: "article",
                    id: "error",
                    title: "Something went wrong please try again.",
                    description: "Something went wrong please try again.",
                    input_message_content: {
                        message_text: "Something went wrong please try again.",
                    },
                },
            ],
            { cache_time: 0 }
        );
    }
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

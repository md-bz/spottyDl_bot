const fs = require("fs/promises");
// const dotenv = require("dotenv").config();
const NodeID3 = require("node-id3");
const { Input } = require("telegraf");

const Spotify = require("./spotify");
const findAndDownload = require("./youtube");
const getGenius = require("./genius");
const getAlbumGenre = require("./deezer");
const {
    createMusicCache,
    getMusicCache,
} = require("../db/musicCacheController");

const spotify = new Spotify(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

async function dl(track) {
    try {
        const artist =
            track.artist ||
            track.artists.map((artist) => artist.name).join(", ");

        const album = track.album.name;
        const genre = await getAlbumGenre(`${album} - ${artist}`);

        const title = track.name;

        const searchQuery = `${title} - ${artist}`;

        const filename = await findAndDownload(searchQuery);
        const geniusInfo = await getGenius(searchQuery);

        let albumCover = await fetch(track.album.images[0].url);
        const coverBuffer = await albumCover.arrayBuffer();

        const tags = {
            title,
            artist,
            genre, //
            album,
            trackNumber: track.track_number,
            year: track.year,
            unsynchronisedLyrics: {
                language: "eng",
                text: geniusInfo.lyrics,
            },
            image: {
                imageBuffer: Buffer.from(coverBuffer, "utf-8"),
            },
        };

        const res = NodeID3.update(tags, filename);

        return { status: "success", filename };
    } catch (error) {
        console.error(error);
        return { status: "Failed" };
    }
}

async function handleTrackAndCaching(track, ctx) {
    track.artist = track.artists.map((artist) => artist.name).join(", ");

    const cache = await getMusicCache(track.name, track.artist);
    console.log(cache);

    if (cache) {
        return await ctx.replyWithAudio(cache.fileId);
    }
    const file = await dl(track);

    if (file.status === "Failed") {
        // #TODO: retry or do sth else
        return ctx.reply(`Failed downloading ${track.title}`);
    }
    const channelMessage = await ctx.telegram.sendAudio(
        process.env.BACKUP_CHANNEL,
        Input.fromLocalFile(file.filename)
    );

    const fileId = channelMessage.audio.file_id;

    await ctx.replyWithAudio(fileId);

    console.log(track.title, track.artist);

    await createMusicCache(track.name, track.artist, fileId);

    await fs.rm(file.filename);
}

async function handleTrack(trackId, ctx) {
    const track = await spotify.getTrack(trackId);

    if (!track || track.error) {
        return await ctx.reply(
            "No track exists with that url, make sure the url is correct."
        );
    }

    await handleTrackAndCaching(track, ctx);
}

async function handleError(error, ctx) {
    console.error(error);
    return await ctx.reply("Something went wrong please try again later.");
}

async function handlePlaylist(playlistId, ctx) {
    try {
        const playlist = await spotify.getPlaylist(playlistId);

        if (!playlist || playlist.error) {
            return await ctx.reply(
                "No playlist exists with that url, make sure the url is correct."
            );
        }

        const items = playlist.tracks.items;

        for (let i = 0; i < items.length; i++) {
            const track = items[i].track;
            await handleTrackAndCaching(track, ctx);
        }
    } catch (error) {
        await handleError(error, ctx);
    }
}

async function handleAlbum(spotifyId) {
    try {
        const album = await spotify.getAlbum(spotifyId);
        const artist = album.artists.map((artist) => artist.name).join(", ");
        const genre = await getAlbumGenre(`${album.name} - ${artist}`);

        let albumCover = await fetch(album.images[0].url);
        const coverBuffer = await albumCover.arrayBuffer();

        for (let i = 0; i < album.tracks.items.length; i++) {
            const track = album.tracks.items[i];

            const artist = track.artists
                .map((artist) => artist.name)
                .join(", ");
            const title = track.name;

            const cache = await getMusicCache(title, artist);

            if (cache) {
                return await ctx.replyWithAudio(cache.fileId);
            }

            const searchQuery = `${title} - ${artist}`;

            const filename = await findAndDownload(searchQuery);
            const geniusInfo = await getGenius(searchQuery);

            const tags = {
                title,
                artist,
                genre,
                album: album.name,
                trackNumber: track.track_number,
                year: album.year,
                unsynchronisedLyrics: {
                    language: "eng",
                    text: geniusInfo.lyrics,
                },
                image: {
                    imageBuffer: Buffer.from(coverBuffer, "utf-8"),
                },
            };

            NodeID3.update(tags, filename);

            const channelMessage = await ctx.telegram.sendAudio(
                process.env.BACKUP_CHANNEL,
                Input.fromLocalFile(filename)
            );

            const fileId = channelMessage.audio.file_id;

            await ctx.replyWithAudio(fileId);

            await createMusicCache(title, artist, fileId);

            await fs.rm(filename);
        }
    } catch (error) {
        await handleError(error, ctx);
    }
}

// handleTrack("5XeFes4btLpXzIVDNQP22m"); //wrong id for testing
// handleTrack("5XeFesFbtLpXzIVDNQP22n");
//
// downloadTrack("https://open.spotify.com/track/0USEeJtdeeJaQ8EIeBB4cz");
// downloadAlbum("1QIlhnFX2vOua9eLXNiUOg?");
// downloadPlaylist("3LkDP3FKsIGbQ8hN44OY45");
// handlePlaylist("37i9dQZF1DWX4UlFW6EJP5"); // wrong id
// handlePlaylist("37i9dQZF1DWX4UlFW6EJPs");

module.exports = { handleTrack, handlePlaylist, handleAlbum, dl };

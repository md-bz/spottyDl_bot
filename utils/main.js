const Spotify = require("./spotify");
const getGenius = require("./genius");
const dotenv = require("dotenv").config();
const findAndDownload = require("./youtube");
const NodeID3 = require("node-id3");
const getAlbumGenre = require("./deezer");

const spotify = new Spotify(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

async function dl(track) {
    try {
        const artist = track.artists.map((artist) => artist.name).join(", ");

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

async function downloadTrack(trackId) {
    const track = await spotify.getTrack(trackId);
    if (!track) return new Error("no track found");
    return await dl(track);
}

async function downloadAlbum(spotifyId) {
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
        }
    } catch (error) {
        console.error(error);
        return { status: "Failed" };
    }
}

async function downloadPlaylist(playlistId) {
    try {
        const playlist = await spotify.getPlaylist(playlistId);
        const items = playlist.tracks.items;

        for (let i = 0; i < items.length; i++) {
            const track = items[i].track;
            await dl(track);
        }
    } catch (error) {
        console.error(error);
        return { status: "Failed" };
    }
}

downloadTrack("5XeFesFbtLpXzIVDNQP22n");
//
// downloadTrack("https://open.spotify.com/track/0USEeJtdeeJaQ8EIeBB4cz");
// downloadAlbum("1QIlhnFX2vOua9eLXNiUOg?");
// downloadPlaylist("3LkDP3FKsIGbQ8hN44OY45");
// downloadPlaylist("37i9dQZF1DWX4UlFW6EJPs");

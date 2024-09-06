const YTMusic = require("ytmusic-api");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs/promises");
const Ffmpeg = require("fluent-ffmpeg");

const yt = new YTMusic.default();

async function findAndDownload(
    searchQuery,
    extension = "mp3",
    filename = `${searchQuery}.${extension}`,
    bitrate = 192
) {
    await yt.initialize();
    const agent = ytdl.createProxyAgent({ uri: "http://localhost:8086" });

    const tracks = await yt.searchSongs(searchQuery);

    if (!tracks || tracks.length === 0) {
        throw new Error("No youtube tracks found for the given search query.");
    }

    return await new Promise((resolve, reject) => {
        Ffmpeg(
            ytdl(tracks[0].videoId, {
                quality: "highestaudio",
                filter: "audioonly",
                agent,
            })
        )
            .audioBitrate(bitrate)
            .format(extension === "mp3" ? "mp3" : "adts")
            .save(filename)
            .on("error", async (err) => {
                // await fs.unlink(filename);
                reject(err);
            })
            .on("end", function () {
                resolve(filename);
            });
    });
}
findAndDownload("monster - eminem");

module.exports = findAndDownload;

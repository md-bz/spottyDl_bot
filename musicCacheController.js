const MusicCache = require("./musicCacheModel");

exports.createMusicCache = async (title, artist, fileId) => {
    return await MusicCache.create({
        title,
        artist,
        fileId,
    });
};

exports.getMusicCache = async (title, artist) => {
    return await MusicCache.findOne({ title, artist });
};

exports.deleteMusicCache = async (title, artist) => {
    return await MusicCache.deleteMany({});
};

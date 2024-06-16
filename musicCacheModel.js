const mongoose = require("mongoose");

const musicCacheSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    artist: {
        type: String,
        required: true,
    },
    fileId: {
        type: String,
        required: true,
    },
});

musicCacheSchema.index({ title: 1, artist: 1 }, { unique: true });

const MusicCache = mongoose.model("MusicCache", musicCacheSchema);

module.exports = MusicCache;

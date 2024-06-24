const Genius = require("genius-lyrics");
const Client = new Genius.Client(process.env.GENIUS_TOKEN);

async function getGenius(searchQuery) {
    try {
        const searches = await Client.songs.search(searchQuery);

        if (!searches || searches.length === 0) {
            return { track: {}, lyrics: "" };
        }
        const track = searches[0];
        const lyrics = await track.lyrics();

        return {
            track,
            lyrics,
        };
    } catch (error) {
        // console.error("");
        return {
            track: {},
            lyrics: "",
        };
    }
}

module.exports = getGenius;

async function searchDeezer(searchQuery, searchType) {
    const response = await fetch(
        `https://api.deezer.com/search${
            searchType ? "/" + searchType : ""
        }?q=${searchQuery}&limit=5`,
        {
            method: "GET",
            headers: { "Accept-Language": "en-US,en;q=0.5" },
        }
    );
    const res = await response.json();
    return res.data;
}

async function getGenre(genreId) {
    const response = await fetch(`https://api.deezer.com/genre/${genreId}`, {
        method: "GET",
        headers: { "Accept-Language": "en-US,en;q=0.5" },
    });
    return await response.json();
}

async function getAlbumGenre(searchQuery) {
    const albums = await searchDeezer(searchQuery, "album");
    if (!albums || albums.length === 0) {
        throw new Error("No deezer album found!");
    }

    console.log(albums[0]);

    const genre = await getGenre(albums[0].genre_id);

    return genre.name;
}
module.exports = getAlbumGenre;

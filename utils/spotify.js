class Spotify {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.token;
        this.expireAt;
    }

    async getToken() {
        if (this.token && Date.now() < this.expireAt) {
            return;
        }
        let response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            body: new URLSearchParams({
                grant_type: "client_credentials",
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization:
                    "Basic " +
                    Buffer.from(
                        this.clientId + ":" + this.clientSecret
                    ).toString("base64"),
            },
        });
        try {
            response = await response.json();
        } catch (error) {
            console.error(error);
        }
        this.token = response.access_token;
        this.expireAt = Date.now() + 1 * 60 * 60 * 1000 - 5 * 1000; // 1 hour from now minus 5 seconds
    }

    async callEndpoint(endpoint, param, method = "GET") {
        await this.getToken();
        const response = await fetch(
            `https://api.spotify.com/v1/${endpoint}/${param}`,
            {
                method,
                headers: { Authorization: "Bearer " + this.token },
            }
        );

        return await response.json();
    }

    getTrack = async (trackId) => await this.callEndpoint("tracks", trackId);

    getTracks = async (trackIds) =>
        await this.callEndpoint("tracks", trackIds.join(","));

    getAlbum = async (albumId) => await this.callEndpoint("albums", albumId);

    getAlbums = async (albumIds) =>
        await this.callEndpoint("albums", albumIds.join(","));
    getPlaylist = async (playlistId) =>
        await this.callEndpoint("playlists", playlistId);

    search = async (searchQuery, type = "track") => {
        await this.getToken();
        let response = await fetch(
            `https://api.spotify.com/v1/search?q=${searchQuery}&type=${type}`,
            {
                method: "GET",
                headers: { Authorization: "Bearer " + this.token },
            }
        );

        return await response.json();
    };
}

module.exports = Spotify;

async function parse(link) {
    try {
        if (link.includes("deezer.page.link")) {
            const res = await fetch(link);
            link = res.url;
        }

        const url = new URL(link.startsWith("http") ? link : "https://" + link);

        let platform = null;
        let type = null;
        let id = null;

        const platforms = ["spotify", "deezer"];

        if (!platforms.some((pl) => url.host.includes(pl))) {
            throw new Error("Unsupported platform or invalid URL.");
        }

        const types = ["track", "album", "playlist"];

        if (!types.some((tp) => url.pathname.includes(tp))) {
            throw new Error("Unsupported type or invalid URL.");
        }

        platform = platforms.find((pl) => url.host.includes(pl));
        type = types.find((tp) => url.pathname.includes(tp));

        const start = url.pathname.indexOf(type) + type.length + 1;
        const queryIndex = url.pathname.indexOf("?", start);
        const end = queryIndex === -1 ? url.pathname.length : queryIndex;

        id = url.pathname.slice(start, end);

        return {
            platform,
            type,
            id,
        };
    } catch (error) {
        throw error;
    }
}
module.exports = parse;

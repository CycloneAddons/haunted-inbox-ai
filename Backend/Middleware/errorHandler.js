import { getSpookyError } from '../Constants/spookyErrors.js';

export function errorHandler(err, req, res, next) {
    if (err?.type === "entity.too.large") {
        return res.status(413).json(getSpookyError(413, "Payload exceeds cauldron limit"));
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json(getSpookyError(400, "Corrupted or malformed JSON body"));
    }

    const status = Number(err.status || err.statusCode) || 500;
    const isProd = (process.env.PTYPE || "").toLowerCase() === "production";
    const msg = isProd && status >= 500 ? null : (err.message || null); 

    if (status >= 500) console.error(err);

    res.status(status).json(getSpookyError(status, msg));
}

export function notFound(req, res) {
    res.status(404).json(getSpookyError(404, `The path ${req.originalUrl || req.url} does not exist in these catacombs`));
}
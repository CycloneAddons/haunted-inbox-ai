import jwt from "jsonwebtoken"
import { getSpookyError } from "../Constants/spookyErrors.js"

function verifyJwt(token, secret) {
    try {
        const payload = jwt.verify(token, secret, {
            algorithms: ["HS256"]
        })

        if (typeof payload !== "object" || typeof payload.exp !== "number" || payload === null) {
            return null;
        }

        const ownerId = payload.sub || payload.userId || payload.id;

        return typeof ownerId === "string" && ownerId.trim() ? ownerId : null;
    } catch (error) {
        return null;
    }
}

function extractBearerToken(authorization = "") {
    const match = authorization.match(/^Bearer\s+(\S+)$/i);
    return match ? match[1] : null;
}

export function getOwnerId(req) {
    const secret = process.env.JWT_SECRET;

    if (!secret) return null;

    const token = extractBearerToken(req.headers.authorization || "");

    return token ? verifyJwt(token, secret) : null;
}

export function requireAuth(req, res, next) {
    const ownerId = getOwnerId(req);

    if (!ownerId) return res.status(401).json(getSpookyError(401, "The Spirits Deny Your Access"));

    req.ownerId = ownerId;

    return next();
}



export function socketAuth(socket, next) {
    const secret = process.env.JWT_SECRET;

    if (!secret) return next(new Error("The Spirits Deny Your Access"));

    const token = socket.handshake.auth.token || extractBearerToken(socket?.handshake?.headers?.authorization || "");

    if (typeof token !== 'string') return next(new Error("The Spirits Deny Your Access"));

    const ownerId = verifyJwt(token, secret);

    if (!ownerId) return next(new Error("The Spirits Deny Your Access"));


    socket.data.ownerId = ownerId;
    return next();

}
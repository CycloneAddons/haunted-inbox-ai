import { Portal } from "../Models/Portal.js";
import { WebhookRequest } from "../Models/WebhookRequest.js";
import { hashToken } from "../Utils/tokens.js";
import { redactHeaders, redactBody } from "../Utils/redact.js";
import crypto from 'crypto';
import mongoose from 'mongoose';


export async function findPortalByToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') return null;
    const tokenHash = hashToken(rawToken);

    const conditions = [
        { tokenHash },
        { token: rawToken },
    ];

    if (mongoose.isValidObjectId(rawToken)) {
        conditions.push({ _id: rawToken });
    }

    const portal = await Portal.findOne({ $or: conditions });
    if (!portal) return null;
    if (portal.expiresAt && portal.expiresAt < new Date()) return null;
    return portal;
}

export function sanitizeBody(req) {
    const ct = req.headers["content-type"] || '';
    let body = null;
    let raw = null;
    const b = req.body;

    if (Buffer.isBuffer(b)) {
        raw = b.toString("base64");
        const text = b.toString('utf8');

        if (ct.includes('json')) {
            try {
                body = JSON.parse(text);
            } catch (e) {
                body = { _raw: text };
            }
        } else if (ct.includes("form")) {
            body = { _raw: text };

        } else if (ct.startsWith("text/")) {
            body = text;
        } else {
            body = { _raw: text };
        }


    } else if (typeof b === "string") {
        raw = b;
        if (ct.includes('json')) {
            try { body = JSON.parse(b); } catch { body = b; }
        } else {
            body = b;
        }
    } else if (b && typeof b === 'object') {
        body = b;
        try { raw = JSON.stringify(b); } catch { raw = null; }
    } else {
        body = null;
    }
    return { body, raw, contentType: ct, size: raw ? Buffer.byteLength(raw) : 0 };
}



export async function captureRequest(portal, req) {
    const { body, raw, contentType, size } = sanitizeBody(req);

    const rawIp = req.ip || req.socket?.remoteAddress ;
    const ip = rawIp ? crypto.createHash("sha256").update(rawIp).digest('hex').slice(0, 16) : null;
    const doc = await WebhookRequest.create({
        portalId: portal._id,
        method: req.method,
        path: req.path || req.url?.split('?')[0] || "",
        query: req.query || {},
        headers: redactHeaders(req.headers || {}),
        body: redactBody(body),
        rawBody: req.rawBody ? req.rawBody.toString('base64') : null,
        contentType,
        bodySize: size,
        sourceIp: ip,
    });
    portal.lastReceivedAt = new Date();
    await portal.save();
    const max = 1000;
    const count = await WebhookRequest.countDocuments({ portalId: portal._id });
    if (count > max) {
        const excess = count - max;
        const oldest = await WebhookRequest.find({ portalId: portal._id })
            .sort({ receivedAt: 1 })
            .limit(excess)
            .select("_id");
        await WebhookRequest.deleteMany({ _id: { $in: oldest.map((d) => d._id) } });
    }
    return doc;
}

export async function deletePortalCascade(portalId) {
    await WebhookRequest.deleteMany({ portalId });
    await Portal.deleteOne({ _id: portalId });
}
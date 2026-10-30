import { Portal } from "../Models/Portal.js";
import { WebhookRequest } from "../Models/WebhookRequest.js";

export async function cleanupExpired() {
    const now = new Date();
    const expired = await Portal.find({ expiresAt: { $lt: now} }).select("_id");

    for(const port of expired) {
        await WebhookRequest.deleteMany({ portalId: port._id });
        await Portal.deleteOne({ _id: port._id });
    }

    const maxReq = 1000;
    const portals = await Portal.find().select("_id");

    for (const port of portals) {
        const count = await WebhookRequest.countDocuments({ portalId: port._id });
        if(count > maxReq) {
            const excess = count - maxReq;

            const oldest = await WebhookRequest.find({ portalId: port._id }).sort({ receivedAt: 1 }).limit(excess).select("_id");
            await WebhookRequest.deleteMany({ _id: { $in : oldest.map((d) => d._id )}})
        }
    }
    
}

export function startCleanupJob() {
    const interval = 3e5;
    const timer = setInterval(() => {
        cleanupExpired().catch((e) => console.error("cleaning err", e.message))
    }, interval);

    timer.unref?.();

    return timer;
}
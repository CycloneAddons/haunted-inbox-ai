import { Router } from "express";
import { Portal } from "../Models/Portal.js";
import { WebhookRequest } from "../Models/WebhookRequest.js";
import { requireAuth } from "../Middleware/auth.js";
import { getSpookyError } from "../Constants/spookyErrors.js";
import { redactBody, redactHeaders } from "../Utils/redact.js";

const router = Router();

router.get("/portals/:id/requests", requireAuth, async (req, res, next) => {
    try {
        const portal = await Portal.findOne({ _id: req.params.id, ownerId: req.ownerId });
        if (!portal) return res.status(404).json(getSpookyError(404, "Portal not found in the catacombs"));

        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 20);
        const { method, since } = req.query;

        if (![page, limit].every(Number.isInteger) || page < 1 || limit < 1 || limit > 100 || (method !== undefined && typeof method !== 'string') || (since !== undefined && typeof since !== 'string')) {
            return res.status(400).json(getSpookyError(400, "Cursed pagination or query filters"));
        }

        const filter = { portalId: portal._id };
        if (method) filter.method = method.toUpperCase();
        if (since && !isNaN(new Date(since).getTime())) filter.receivedAt = { $gt: new Date(since) };

        const [items, total] = await Promise.all([
            WebhookRequest.find(filter).sort({ receivedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            WebhookRequest.countDocuments(filter),
        ]);

        const sanitizedItems = items.map(item => ({
            ...item,
            body: redactBody(item.body),
            headers: redactHeaders(item.headers || {})
        }));

        res.json({ page, limit, total, items: sanitizedItems });
    } catch (error) {
        next(error);
    }
});

router.get("/requests/:id", requireAuth, async(req, res, next) => {
    try {
        const doc = await WebhookRequest.findById(req.params.id).lean();
        if (!doc) return res.status(404).json(getSpookyError(404, "Webhook request not found in the crypt"));

        if (!await Portal.findOne({ _id: doc.portalId, ownerId: req.ownerId })) {
            return res.status(404).json(getSpookyError(404, "Portal not found for this request"));
        }

        res.json({
            ...doc,
            body: redactBody(doc.body),
            headers: redactHeaders(doc.headers || {})
        });
    } catch (error) {
        next(error);
    }
});

export default router;
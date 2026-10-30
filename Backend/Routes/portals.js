
import { Router } from 'express';
import { Portal } from '../Models/Portal.js';
import { WebhookRequest } from '../Models/WebhookRequest.js';
import { generateToken } from '../Utils/tokens.js';
import { requireAuth } from '../Middleware/auth.js';
import { deletePortalCascade } from '../Services/webhookService.js';
import { getRandomPortalSummon } from '../Constants/spookyText.js';
import { getSpookyError } from '../Constants/spookyErrors.js';

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
    try {
        const portals = await Portal.find({ ownerId: req.ownerId }).sort({ createdAt: -1 }).lean();
        const counts = await WebhookRequest.aggregate([
            { $match: { portalId: { $in: portals.map(p => p._id) } } },
            { $group: { _id: "$portalId", count: { $sum: 1 } } }
        ]);

        const countMap = Object.fromEntries(counts.map(c => [String(c._id), c.count]));
        const base = process.env.WEBHOOK_BASE_URL || (req.get('host') ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3000}`);

        res.json({
            portals: portals.map(p => ({
                id: p._id,
                _id: p._id,
                name: p.name,
                token: p.token || "",
                webhookUrl: `${base}/h/${p.token || p._id}`,
                createdAt: p.createdAt,
                expiresAt: p.expiresAt,
                lastReceivedAt: p.lastReceivedAt,
                requestCount: countMap[String(p._id)] || 0,
            })),
        });
    } catch (e) {
        next(e);
    }
})

router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        const portal = await Portal.findOne({ _id: req.params.id, ownerId: req.ownerId }).lean();
        if (!portal) return res.status(404).json(getSpookyError(404, "Portal not found in the catacombs"));
        const base = process.env.WEBHOOK_BASE_URL || (req.get('host') ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3000}`);

        res.json({
            portal: {
                id: portal._id,
                _id: portal._id,
                name: portal.name,
                token: portal.token || "",
                webhookUrl: `${base}/h/${portal.token || portal._id}`,
                createdAt: portal.createdAt,
                expiresAt: portal.expiresAt,
                lastReceivedAt: portal.lastReceivedAt,
            }
        });
    } catch (e) {
        next(e);
    }
})

router.post("/", requireAuth, async (req, res, next) => {
    try {
        const name = req.body?.name ?? "";
        if (typeof name !== "string" || name.length > 100) {
            return res.status(400).json(getSpookyError(400, "Portal name is cursed or too long"));
        }

        const { raw, hash } = generateToken();
        const expiresAt = new Date(Date.now() + 36e5);
        const portal = await Portal.create({
            name,
            token: raw,
            tokenHash: hash,
            ownerId: req.ownerId,
            expiresAt
        })

        const base = process.env.WEBHOOK_BASE_URL || (req.get('host') ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3000}`);

        res.status(201).json({
            id: portal._id,
            _id: portal._id,
            name: portal.name,
            token: raw,
            createdAt: portal.createdAt,
            expiresAt: portal.expiresAt,
            webhookUrl: `${base}/h/${raw}`,
            spookyMessage: getRandomPortalSummon(),
        });
    } catch (e) {
        next(e);
    }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        const portal = await Portal.findOne({ _id: req.params.id, ownerId: req.ownerId });
        
        if (!portal) return res.status(404).json(getSpookyError(404, "Portal not found for deletion"));
        
        await deletePortalCascade(portal._id);
        
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
});

export default router;

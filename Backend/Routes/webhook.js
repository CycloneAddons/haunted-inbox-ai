import { Router } from 'express';
import { webhookLimiter } from '../Middleware/rateLimit.js';
import { captureRequest, findPortalByToken } from '../Services/webhookService.js';
import { getRandomSpookyWhisper } from '../Constants/spookyText.js';
import { getSpookyError } from '../Constants/spookyErrors.js';

const router = Router();

const handler = async (req, res) => {
    try {
        const portal = await findPortalByToken(req.params.token);
        if (!portal) return res.status(404).json(getSpookyError(404, "Webhook portal not found or expired"));
        const doc = await captureRequest(portal, req);
        const io = req.app.get("io");

        if (io) {
            io.to(`portal:${portal._id}`).emit("request:new", {
                requestId: doc._id,
                method: doc.method,
                receivedAt: doc.receivedAt
            });
        }

        const whisper = getRandomSpookyWhisper();
        res.setHeader('X-Spooky-Whisper', whisper);
        res.status(200).json({ success: true, id: doc._id, spookyWhisper: whisper });
    } catch (error) {
        res.status(500).json(getSpookyError(500, 'Internal catacomb error while capturing webhook'));
    }
};

router.all("/h/:token", webhookLimiter, handler);

export default router;
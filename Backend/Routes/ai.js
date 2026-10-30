import { Router } from 'express'
import { requireAuth } from '../Middleware/auth.js'
import { aiLimiter } from '../Middleware/rateLimit.js'

import { generateCode, autopsyRequest } from '../Services/aiService.js';
import { getRandomSpookyWhisper, getRandomAutopsyNote, getRandomCodegenNote, getSpookyError } from '../Constants/spookyText.js';

const router = Router();

const allowedTasks = ['express-handler', 'typescript-interface'];

router.post('/requests/:id/autopsy', requireAuth, aiLimiter, async (req, res, next) => {
    try {
        const result = await autopsyRequest(req.params.id, req.ownerId);
        res.json({
            ...result,
            spookyWhisper: getRandomSpookyWhisper(),
            spookyNote: getRandomAutopsyNote(),
        });
    } catch (e) {
        next(e);
    }
});

router.post('/requests/:id/generate-code', requireAuth, aiLimiter, async (req, res, next) => {
    try {
        const { task } = req.body || {};
        if (typeof task !== 'string' || !allowedTasks.includes(task)) {
            return res.status(400).json(getSpookyError(400, `Task must be one of: ${allowedTasks.join(', ')}`));
        }
        const result = await generateCode(req.params.id, req.ownerId, task);
        res.json({
            ...result,
            spookyWhisper: getRandomSpookyWhisper(),
            spookyNote: getRandomCodegenNote(),
        });
    } catch (e) {
        next(e);
    }
});

export default router;
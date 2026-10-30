import rateLimit from 'express-rate-limit'
import { getSpookyError } from '../Constants/spookyErrors.js'

export const globalLimiter = rateLimit({
    windowMs: parseInt("90000", 10),
    max: parseInt("100", 10),
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    handler: (req, res) => res.status(429).json(getSpookyError(429, "Global rate limit exceeded")),
})

export const webhookLimiter = rateLimit({
    windowMs: parseInt("60000", 10),
    max: parseInt("60", 10),
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    handler: (req, res) => res.status(429).json(getSpookyError(429, "Webhook intake rate limit exceeded")),
})

export const aiLimiter = rateLimit({
    windowMs: parseInt("3600000", 10),
    max: parseInt("20", 10),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ownerId || req.ip,
    validate: { trustProxy: false, keyGeneratorIpFallback: false },
    handler: (req, res) => res.status(429).json(getSpookyError(429, "AI quota exhausted for this hour")),
})
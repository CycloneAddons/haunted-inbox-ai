import { Server } from 'socket.io'
import mongoose from 'mongoose'
import express from 'express'
import http from 'node:http'
import helmet from 'helmet'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import 'dotenv/config'

import { connectDB } from './Services/db.js'

import { errorHandler, notFound } from './Middleware/errorHandler.js'
import { globalLimiter } from './Middleware/rateLimit.js'
import { socketAuth } from './Middleware/auth.js'



import requestsRouter from './Routes/requests.js'
import webhooksRouter from './Routes/webhook.js'
import portalsRouter from './Routes/portals.js'
import aiRouter from './Routes/ai.js'



import { startCleanupJob } from './Services/cleanupService.js'
import { Portal } from './Models/Portal.js'
import { getRandomSpookyWhisper, getSpookyError } from './Constants/spookyText.js'

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidateDistPaths = [
  path.join(__dirname, 'dist'),
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), 'Backend', 'dist'),
];
const distPath = candidateDistPaths.find((p) => fs.existsSync(p)) || candidateDistPaths[0];

const origins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://haunted-inbox-ai.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

const bodyLimit = "256kb"

app.set('trust proxy', 1)

app.use((req, res, next) => {
  const matched = req.headers['x-matched-path'];
  if (matched && matched !== '/index.js' && !matched.endsWith('/index.js')) {
    const queryIdx = req.url.indexOf('?');
    const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    req.url = matched + query;
  }
  next();
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}))

app.use(express.json({
  limit: bodyLimit,
  type: ['application/json', 'application/*+json'],
  verify(req, res, buffer) {
    req.rawBody = Buffer.from(buffer);
  }
}))

app.use(express.urlencoded({
  extended: true,
  limit: bodyLimit,
  type: ['application/x-www-form-urlencoded']
}))

app.use(express.text({
  limit: bodyLimit,
  type: ['text/*', 'application/xml', 'application/javascript'],
  verify(req, res, buffer) {
    req.rawBody = Buffer.from(buffer)
  }
}))


app.use(express.raw({
  limit: bodyLimit,
  type: (req) => !req.is('application/json')
    && !req.is('application/*+json')
    && !req.is('application/x-www-form-urlencoded')
    && !req.is('text/*')
    && !req.is('application/xml')
    && !req.is('application/javascript')
}))

app.use('/api', globalLimiter);


app.use(async (req, res, next) => {
  try {
    await connectDB();
    next()
  } catch (error) {
    next(error);
  }
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    spookyWhisper: getRandomSpookyWhisper(),
  })
})
app.post('/api/auth/guest', (req, res) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured on the server' });
  }

  const rawId = req.body?.guestId;
  const guestId = (typeof rawId === 'string' && rawId.startsWith('guest_') && rawId.length <= 48)
    ? rawId
    : `guest_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

  const shortCode = guestId.slice(-4).toUpperCase();
  const username = `Guest-${shortCode}`;

  const token = jwt.sign(
    {
      sub: guestId,
      username,
      isGuest: true,
    },
    secret,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    user: {
      id: guestId,
      username,
      isGuest: true,
      avatar: null,
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json(getSpookyError(500, 'JWT_SECRET is not configured on the server'));
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return res.status(401).json(getSpookyError(401, 'No authorization token provided'));
  }

  try {
    const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
    const id = payload.sub || payload.userId || payload.id;
    if (!id) return res.status(401).json(getSpookyError(401, 'Invalid token payload'));

    res.json({
      user: {
        id,
        username: payload.username || (payload.isGuest ? 'Guest Investigator' : 'Investigator'),
        avatar: payload.avatar || null,
        email: payload.email || null,
        isGuest: Boolean(payload.isGuest),
      },
    });
  } catch {
    return res.status(401).json(getSpookyError(401, 'Invalid or expired token'));
  }
});

app.get('/api/auth/discord', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({
      error: 'DISCORD_CLIENT_ID is not configured in backend .env'
    });
  }

  const frontendUrl = req.query.redirect || req.headers.referer || process.env.FRONTEND_URL || 'http://localhost:5173/dashboard';
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/discord/callback`;
  const state = Buffer.from(JSON.stringify({ frontendUrl })).toString('base64url');

  const discordAuthUrl = new URL('https://discord.com/oauth2/authorize');
  discordAuthUrl.searchParams.set('client_id', clientId);
  discordAuthUrl.searchParams.set('response_type', 'code');
  discordAuthUrl.searchParams.set('redirect_uri', redirectUri);
  discordAuthUrl.searchParams.set('scope', 'identify email');
  discordAuthUrl.searchParams.set('state', state);

  res.redirect(discordAuthUrl.toString());
});

app.get('/api/auth/discord/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173/dashboard';
  try {
    if (state) {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      if (parsed.frontendUrl) frontendUrl = parsed.frontendUrl;
    }
  } catch {}

  const separator = frontendUrl.includes('?') ? '&' : '?';

  if (error || !code) {
    const errMsg = error_description || error || 'Missing authorization code from Discord';
    return res.redirect(`${frontendUrl}${separator}auth_error=${encodeURIComponent(errMsg)}`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const secret = process.env.JWT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/discord/callback`;

  if (!clientId || !clientSecret || !secret) {
    return res.redirect(`${frontendUrl}${separator}auth_error=${encodeURIComponent('Discord credentials (DISCORD_CLIENT_ID/SECRET) or JWT_SECRET are not set in .env')}`);
  }

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      const msg = tokenData.error_description || tokenData.error || 'Discord token exchange failed';
      return res.redirect(`${frontendUrl}${separator}auth_error=${encodeURIComponent(msg)}`);
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `${tokenData.token_type || 'Bearer'} ${tokenData.access_token}`,
      },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.id) {
      return res.redirect(`${frontendUrl}${separator}auth_error=${encodeURIComponent('Failed to fetch Discord user profile')}`);
    }

    const ownerId = `discord_${userData.id}`;
    const username = userData.global_name || userData.username || 'Discord User';
    const avatarUrl = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : null;

    const token = jwt.sign(
      {
        sub: ownerId,
        username,
        avatar: avatarUrl,
        email: userData.email || null,
        isGuest: false,
      },
      secret,
      { expiresIn: '30d' }
    );

    return res.redirect(`${frontendUrl}${separator}token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Discord OAuth error:', err);
    return res.redirect(`${frontendUrl}${separator}auth_error=${encodeURIComponent(err.message || 'OAuth failure')}`);
  }
});

app.use('/api/portals', portalsRouter);
app.use('/api', requestsRouter);
app.use('/api', aiRouter);
app.use('/', webhooksRouter);

app.use(express.static(distPath));

app.get('/{*path}', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/h') || /\.[a-zA-Z0-9]+$/.test(req.path)) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: origins,
    credentials: true
  }
});

io.use(socketAuth);

io.on('connection', (socket) => {
  socket.on('subscribe:portal', async (portalId, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};

    try {
      if (
        typeof portalId !== 'string'
        || !mongoose.isValidObjectId(portalId)
    ) {
        reply({ ok: false, error: 'Invalid portal ID' });
        return;
      }

      const portal = await Portal.findById(portalId)
        .select('_id ownerId')
        .lean();

      if (
        !portal
        || String(portal.ownerId) !== String(socket.data.ownerId)
      ) {
        reply({ ok: false, error: 'Portal not found' });
        return;
      }

      socket.join(`portal:${portalId}`);
      reply({ ok: true });
    } catch {
      reply({ ok: false, error: 'Subscription failed' });
    }
  });

  socket.on('unsubscribe:portal', (portalId) => {
    if (typeof portalId === 'string' && mongoose.isValidObjectId(portalId)) {
      socket.leave(`portal:${portalId}`);
    }
  });
});

app.set('io', io);

async function start() {
  if (!process.env.MONGO_URI) {
    throw new Error("mongodb uri missing");
  }

  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`backend listening on ${PORT}`);
  })

  startCleanupJob();
}

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received; shutting down`);

  io.close()

  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error('MongoDB shutdown error:', error.message);
  }

  process.exit(0);
}

if (!process.env.VERCEL) {
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  start().catch((error) => {
    console.error('Startup failed:', error);
    process.exitCode = 1;
  });
}

export { app, httpServer, io };
export default app;
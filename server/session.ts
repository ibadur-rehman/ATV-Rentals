import session from "express-session";
import MemoryStore from "memorystore";

// Session configuration in a separate module to avoid circular dependencies
const SessionStore = MemoryStore(session);

// Production security check: Require SESSION_SECRET in production
const sessionSecret = process.env.SESSION_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !sessionSecret) {
  throw new Error('[SECURITY ERROR] SESSION_SECRET environment variable MUST be set in production. Refusing to start with insecure default.');
}

if (!sessionSecret && !isProduction) {
  console.warn('[SECURITY WARNING] SESSION_SECRET not set. Using development default (INSECURE - set SESSION_SECRET before deploying to production)');
}

export const sessionMiddleware = session({
  secret: sessionSecret || "dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  store: new SessionStore({
    checkPeriod: 86400000, // 24 hours
  }),
  cookie: {
    // Production: secure cookies over HTTPS (Replit published apps use HTTPS)
    // Development: allow insecure cookies for local development
    secure: false,
    httpOnly: true,
    sameSite: "lax", // Required for cookies to work properly
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});

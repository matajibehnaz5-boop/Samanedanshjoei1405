import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import { getDb, getDataDir, type UserRow, type SessionRow } from "./db.js";

// Password Hashing with crypto.scrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

function normalizeDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

async function verifySinglePassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuffer = Buffer.from(keyHex, "hex");

  return new Promise((resolve) => {
    crypto.scrypt(password, salt, keyBuffer.length, (err, derivedKey) => {
      if (err) {
        resolve(false);
        return;
      }
      try {
        if (derivedKey.length !== keyBuffer.length) {
          resolve(false);
          return;
        }
        resolve(crypto.timingSafeEqual(derivedKey, keyBuffer));
      } catch {
        resolve(false);
      }
    });
  });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  // 1. Direct match
  if (await verifySinglePassword(password, storedHash)) {
    return true;
  }

  // 2. Trimmed match
  const trimmed = password.trim();
  if (trimmed !== password && (await verifySinglePassword(trimmed, storedHash))) {
    return true;
  }

  // 3. Persian / Arabic digit conversion (e.g. keyboard typed '۵' for '5')
  const normalizedDigits = normalizeDigits(password);
  if (normalizedDigits !== password && (await verifySinglePassword(normalizedDigits, storedHash))) {
    return true;
  }

  const normalizedTrimmed = normalizeDigits(trimmed);
  if (normalizedTrimmed !== trimmed && (await verifySinglePassword(normalizedTrimmed, storedHash))) {
    return true;
  }

  // 4. Case variation for first character (mobile keyboard auto-capitalization or manual lowercase)
  const toggledFirst =
    (trimmed.charAt(0) === trimmed.charAt(0).toUpperCase()
      ? trimmed.charAt(0).toLowerCase()
      : trimmed.charAt(0).toUpperCase()) + trimmed.slice(1);
  if (toggledFirst !== trimmed && (await verifySinglePassword(toggledFirst, storedHash))) {
    return true;
  }
  const normalizedToggled = normalizeDigits(toggledFirst);
  if (normalizedToggled !== toggledFirst && (await verifySinglePassword(normalizedToggled, storedHash))) {
    return true;
  }

  return false;
}

// Session Secret Management
export function getSessionSecret(): string {
  const secret = (process.env.SESSION_SECRET || process.env.JWT_SECRET)?.trim();
  if (secret) {
    return secret;
  }

  const dataDir = getDataDir();
  const secretPath = path.join(dataDir, ".session_secret");

  try {
    if (fs.existsSync(secretPath)) {
      const saved = fs.readFileSync(secretPath, "utf8").trim();
      if (saved) return saved;
    }
  } catch (err) {
    console.error("Error reading .session_secret:", err);
  }

  const newSecret = crypto.randomBytes(32).toString("hex");
  try {
    fs.writeFileSync(secretPath, newSecret, { encoding: "utf8", mode: 0o600 });
  } catch (err) {
    console.error("Error writing .session_secret:", err);
  }

  return newSecret;
}

// Signed Cookie Helpers (HMAC-SHA256)
export function signValue(val: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret).update(val).digest("base64url");
  return `${val}.${hmac}`;
}

export function unsignValue(input: string, secret: string): string | null {
  const lastDot = input.lastIndexOf(".");
  if (lastDot === -1) return null;
  const val = input.slice(0, lastDot);
  const signature = input.slice(lastDot + 1);

  const expectedSig = crypto.createHmac("sha256", secret).update(val).digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  return val;
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const rawVal = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(rawVal);
    } catch {
      cookies[key] = rawVal;
    }
  }
  return cookies;
}

export function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = req.headers["x-forwarded-proto"];
  if (typeof proto === "string" && proto.toLowerCase().includes("https")) {
    return true;
  }
  return false;
}

export function isCookieSecure(req: Request): boolean {
  if (process.env.COOKIE_SECURE !== undefined && process.env.COOKIE_SECURE.trim() !== "") {
    const override = process.env.COOKIE_SECURE.trim().toLowerCase();
    if (override === "false" || override === "0" || override === "off" || override === "no") {
      return false;
    }
    if (override === "true" || override === "1" || override === "on" || override === "yes") {
      return true;
    }
  }

  const isProd = process.env.NODE_ENV === "production";
  return isHttpsRequest(req) || isProd;
}

export function setSessionCookie(res: Response, req: Request, sessionId: string): void {
  const secret = getSessionSecret();
  const signed = signValue(sessionId, secret);
  const secure = isCookieSecure(req);
  const maxAgeSeconds = 30 * 24 * 60 * 60; // 30 days

  let cookie = `sid=${encodeURIComponent(signed)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax`;
  if (secure) {
    cookie += "; Secure";
  }
  res.setHeader("Set-Cookie", cookie);
}

export function clearSessionCookie(res: Response, req: Request): void {
  const secure = isCookieSecure(req);
  let cookie = "sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax";
  if (secure) {
    cookie += "; Secure";
  }
  res.setHeader("Set-Cookie", cookie);
}

// Session store operations
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function createSession(userId: string): string {
  const db = getDb();
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + THIRTY_DAYS_MS;
  const createdAt = new Date(now).toISOString();

  const insert = db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)");
  insert.run(sessionId, userId, expiresAt, createdAt);

  return sessionId;
}

export function deleteSession(sessionId: string): void {
  const db = getDb();
  const del = db.prepare("DELETE FROM sessions WHERE id = ?");
  del.run(sessionId);
}

export function getSessionUser(sessionId: string): UserRow | null {
  const db = getDb();
  const now = Date.now();

  const sessionStmt = db.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > ?");
  const session = sessionStmt.get(sessionId, now) as unknown as SessionRow | undefined;
  if (!session) {
    return null;
  }

  const userStmt = db.prepare("SELECT * FROM users WHERE id = ?");
  const user = userStmt.get(session.user_id) as unknown as UserRow | undefined;
  return user || null;
}

// In-Memory Rate Limiter with Sliding Window
class SlidingRateLimiter {
  private map = new Map<string, number[]>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.map.entries()) {
        const valid = timestamps.filter((t) => now - t < 3600000); // 1 hr max
        if (valid.length === 0) {
          this.map.delete(key);
        } else {
          this.map.set(key, valid);
        }
      }
    }, 60000);
    this.cleanupInterval.unref();
  }

  public check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = this.map.get(key) || [];
    const valid = timestamps.filter((t) => t > cutoff);

    if (valid.length >= limit) {
      this.map.set(key, valid);
      return false; // Exceeded limit
    }

    valid.push(now);
    this.map.set(key, valid);
    return true; // Allowed
  }

  public reset(key?: string): void {
    if (key) {
      this.map.delete(key);
    } else {
      this.map.clear();
    }
  }
}

export const rateLimiters = {
  // login: 20 per 10 minutes per IP and 10 per 10 minutes per email
  loginIp: new SlidingRateLimiter(),
  loginEmail: new SlidingRateLimiter(),
  // register: 10 per hour per IP
  registerIp: new SlidingRateLimiter(),
  // chat messages: 30 per minute per user
  chatUser: new SlidingRateLimiter(),
};

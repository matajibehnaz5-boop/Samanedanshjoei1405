import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getDb, getDataDir, exportDatabaseBackup, restoreDatabaseBackup, type UserRow, type ChatMessageRow } from "./db.js";
import {
  hashPassword,
  verifyPassword,
  parseCookies,
  unsignValue,
  getSessionSecret,
  setSessionCookie,
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionUser,
  rateLimiters,
} from "./auth.js";

export interface AuthenticatedRequest extends Request {
  user?: UserRow;
  sessionId?: string;
}

export interface FormattedUser {
  id: string;
  email: string;
  name: string;
  studentId: string;
  role: string;
  profile: Record<string, any>;
  field: string;
  term: string;
  institute: string;
  phone: string;
  avatar: string;
  gpa: number | null;
  creditsPassed: number | null;
  creditsTotal: number | null;
  createdAt: string;
}

export function formatUser(row: UserRow): FormattedUser {
  let profileData: Record<string, any> = {};
  try {
    profileData = typeof row.profile === "string" ? JSON.parse(row.profile) : row.profile || {};
  } catch {
    profileData = {};
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    studentId: row.student_id || "",
    role: row.role,
    profile: profileData,
    field: profileData.field || "",
    term: profileData.term || "",
    institute: profileData.institute || "",
    phone: profileData.phone || "",
    avatar: profileData.avatar || "",
    gpa: profileData.gpa ?? null,
    creditsPassed: profileData.creditsPassed ?? null,
    creditsTotal: profileData.creditsTotal ?? null,
    createdAt: row.created_at,
  };
}

export function getClientIp(req: Request): string {
  // Express manages req.ip based on the 'trust proxy' configuration:
  // - If trust proxy is configured, req.ip is extracted from trusted proxy headers.
  // - If trust proxy is disabled (default), req.ip is strictly the socket remoteAddress,
  //   preventing client spoofing of X-Forwarded-For headers.
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}

export const apiRouter = Router();

// GET /api/health - Public health check returning { ok: true } without any user data
apiRouter.get("/health", (_req: Request, res: Response): void => {
  res.json({ ok: true });
});

// Middleware: Enforce Content-Type: application/json for POST and PATCH requests
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === "POST" || req.method === "PATCH") {
    const isLogoutWithoutBody =
      req.path === "/auth/logout" &&
      (!req.headers["content-length"] || req.headers["content-length"] === "0");

    if (!isLogoutWithoutBody) {
      const contentType = req.headers["content-type"] || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        res.status(415).json({ message: "Content-Type must be application/json" });
        return;
      }
    }
  }
  next();
});

// Middleware: Session authentication for protected routes
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const cookies = parseCookies(req.headers.cookie);
  const rawSid = cookies.sid;
  if (!rawSid) {
    res.status(401).json({ message: "Unauthorized: Missing session" });
    return;
  }

  const secret = getSessionSecret();
  const sessionId = unsignValue(rawSid, secret);
  if (!sessionId) {
    res.status(401).json({ message: "Unauthorized: Invalid session signature" });
    return;
  }

  const user = getSessionUser(sessionId);
  if (!user) {
    res.status(401).json({ message: "Unauthorized: Session expired or invalid" });
    return;
  }

  req.user = user;
  req.sessionId = sessionId;
  next();
}

// Middleware: Server-side role verification for admin-only actions
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Forbidden: Admin role required" });
    return;
  }
  next();
}

// Every route in apiRouter EXCEPT register, login, and health requires a logged-in session
apiRouter.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.path === "/auth/register" || req.path === "/auth/login" || req.path === "/health") {
    next();
    return;
  }
  requireAuth(req, res, next);
});

// POST /api/auth/register
apiRouter.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const ip = getClientIp(req);
  // Rate limit: 10 attempts per 15 minutes per IP (900,000 ms)
  const fifteenMinutesMs = 15 * 60 * 1000;
  if (!rateLimiters.registerIp.check(ip, 10, fifteenMinutesMs)) {
    res.status(429).json({ message: "Too many registrations from this IP. Please try again in 15 minutes." });
    return;
  }

  const { email, password, name, studentId } = req.body || {};

  // Validate email
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 255) {
    res.status(400).json({ message: "Valid email (max 255 characters) is required" });
    return;
  }

  // Validate password length
  if (!password || typeof password !== "string" || password.length < 6 || password.length > 128) {
    res.status(400).json({ message: "Password must be between 6 and 128 characters" });
    return;
  }

  // Validate name length
  if (!name || typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    res.status(400).json({ message: "Name is required and must be under 100 characters" });
    return;
  }

  // Validate studentId length if provided
  if (studentId !== undefined && (typeof studentId !== "string" || studentId.trim().length > 50)) {
    res.status(400).json({ message: "Student ID must not exceed 50 characters" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Admin account check: Nobody can register with ADMIN_EMAIL
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && normalizedEmail === adminEmail) {
    res.status(403).json({ message: "Registration with administrator email is forbidden" });
    return;
  }

  const db = getDb();
  const existingUser = db
    .prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE")
    .get(normalizedEmail) as unknown as { id: string } | undefined;

  if (existingUser) {
    res.status(409).json({ message: "Email is already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const cleanStudentId = typeof studentId === "string" ? studentId.trim() : null;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, student_id, role, profile, created_at)
    VALUES (?, ?, ?, ?, ?, 'student', '{}', ?)
  `).run(id, normalizedEmail, passwordHash, name.trim(), cleanStudentId, now);

  const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as UserRow;
  const sessionId = createSession(newUser.id);
  setSessionCookie(res, req, sessionId);

  res.status(201).json({ user: formatUser(newUser) });
});

// POST /api/auth/login
apiRouter.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body || {};

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  if (email.length > 255 || password.length > 128) {
    res.status(400).json({ message: "Invalid email or password length" });
    return;
  }

  const ip = getClientIp(req);
  const normalizedEmail = email.trim().toLowerCase();

  // Check if a password/lockout reset was performed via CLI script
  try {
    const dataDir = getDataDir();
    const resetFile = path.join(dataDir, ".lockout_reset");
    if (fs.existsSync(resetFile)) {
      const resetData = JSON.parse(fs.readFileSync(resetFile, "utf-8"));
      if (resetData?.email === normalizedEmail) {
        rateLimiters.loginEmail.reset(normalizedEmail);
        rateLimiters.loginIp.reset();
        try {
          fs.unlinkSync(resetFile);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }

  // Rate limit: 10 attempts per 15 minutes per IP and 10 per 15 minutes per email
  const fifteenMinutesMs = 15 * 60 * 1000;
  if (!rateLimiters.loginIp.check(ip, 10, fifteenMinutesMs)) {
    res.status(429).json({ message: "Too many login attempts from this IP. Please try again in 15 minutes." });
    return;
  }
  if (!rateLimiters.loginEmail.check(normalizedEmail, 10, fifteenMinutesMs)) {
    res.status(429).json({ message: "Too many login attempts for this account. Please try again in 15 minutes." });
    return;
  }

  const db = getDb();
  const user = db
    .prepare(`
      SELECT * FROM users 
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
         OR LOWER(TRIM(name)) = LOWER(TRIM(?))
         OR (student_id IS NOT NULL AND LOWER(TRIM(student_id)) = LOWER(TRIM(?)))
    `)
    .get(normalizedEmail, normalizedEmail, normalizedEmail) as unknown as UserRow | undefined;

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // Check account-level lockout
  if (user.locked_until && user.locked_until > Date.now()) {
    res.status(423).json({ message: "Account is temporarily locked due to repeated failed login attempts. Please try again later or contact the administrator." });
    return;
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    // Record failed attempt and lock account if limit reached
    const attempts = (user.failed_attempts || 0) + 1;
    const lockUntil = attempts >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
    try {
      db.prepare("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?").run(attempts, lockUntil, user.id);
    } catch {
      // ignore
    }

    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // Successful login: clear failed attempts and lockout
  if ((user.failed_attempts || 0) > 0 || (user.locked_until || 0) > 0) {
    try {
      db.prepare("UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?").run(user.id);
    } catch {
      // ignore
    }
  }

  const sessionId = createSession(user.id);
  setSessionCookie(res, req, sessionId);

  res.json({ user: formatUser(user) });
});

// POST /api/auth/logout
apiRouter.post("/auth/logout", (req: Request, res: Response): void => {
  const cookies = parseCookies(req.headers.cookie);
  const rawSid = cookies.sid;
  if (rawSid) {
    const secret = getSessionSecret();
    const sessionId = unsignValue(rawSid, secret);
    if (sessionId) {
      deleteSession(sessionId);
    }
  }

  clearSessionCookie(res, req);
  res.json({ message: "Logged out successfully" });
});

// GET /api/me (User can strictly read only their own profile)
apiRouter.get("/me", (req: AuthenticatedRequest, res: Response): void => {
  res.json({ user: formatUser(req.user!) });
});

// PATCH /api/me (User can strictly edit only their own profile)
apiRouter.patch("/me", (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const body = req.body || {};

  // ONLY these fields can be updated: name, studentId, field, term, institute, phone, avatar, gpa, creditsPassed, creditsTotal
  // Never role or email!
  let newName = user.name;
  let newStudentId = user.student_id;

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100) {
      res.status(400).json({ message: "Name must be between 1 and 100 characters" });
      return;
    }
    newName = body.name.trim();
  }

  if (body.studentId !== undefined) {
    if (typeof body.studentId !== "string" || body.studentId.trim().length > 50) {
      res.status(400).json({ message: "Student ID must not exceed 50 characters" });
      return;
    }
    newStudentId = body.studentId.trim();
  }

  let profileData: Record<string, any> = {};
  try {
    profileData = typeof user.profile === "string" ? JSON.parse(user.profile) : user.profile || {};
  } catch {
    profileData = {};
  }

  // Validate avatar size limit (max 200 KB, ~300,000 characters)
  if (body.avatar !== undefined) {
    if (typeof body.avatar === "string") {
      if (body.avatar.length > 300000) {
        res.status(400).json({ message: "Avatar image size must not exceed 200 KB" });
        return;
      }
      profileData.avatar = body.avatar;
    } else if (body.avatar === null || body.avatar === "") {
      profileData.avatar = "";
    }
  }

  const textFields = ["field", "term", "institute", "phone"] as const;
  for (const field of textFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] === "string") {
        if (body[field].length > 100) {
          res.status(400).json({ message: `${field} must not exceed 100 characters` });
          return;
        }
        profileData[field] = body[field].trim();
      }
    }
  }

  // Validate numeric fields
  if (body.gpa !== undefined) {
    const val = Number(body.gpa);
    if (isNaN(val) || val < 0 || val > 20) {
      res.status(400).json({ message: "GPA must be a number between 0 and 20" });
      return;
    }
    profileData.gpa = val;
  }

  if (body.creditsPassed !== undefined) {
    const val = Number(body.creditsPassed);
    if (isNaN(val) || val < 0 || val > 500) {
      res.status(400).json({ message: "Credits passed must be between 0 and 500" });
      return;
    }
    profileData.creditsPassed = Math.round(val);
  }

  if (body.creditsTotal !== undefined) {
    const val = Number(body.creditsTotal);
    if (isNaN(val) || val < 0 || val > 500) {
      res.status(400).json({ message: "Total credits must be between 0 and 500" });
      return;
    }
    profileData.creditsTotal = Math.round(val);
  }

  const db = getDb();
  db.prepare(`
    UPDATE users
    SET name = ?, student_id = ?, profile = ?
    WHERE id = ?
  `).run(newName, newStudentId, JSON.stringify(profileData), user.id);

  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as unknown as UserRow;
  res.json({ user: formatUser(updatedUser) });
});

// POST /api/me/password
apiRouter.post("/me/password", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: "Current and new password are required" });
    return;
  }

  if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 128) {
    res.status(400).json({ message: "New password must be between 6 and 128 characters" });
    return;
  }

  const user = req.user!;
  const isValid = await verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    res.status(401).json({ message: "Current password is incorrect" });
    return;
  }

  const newHash = await hashPassword(newPassword);
  const db = getDb();
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, user.id);

  res.json({ message: "Password updated successfully" });
});

// GET /api/messages
apiRouter.get("/messages", (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const afterId = req.query.after ? Number(req.query.after) : null;

  let rows: ChatMessageRow[];
  if (afterId && !isNaN(afterId)) {
    rows = db
      .prepare("SELECT * FROM chat_messages WHERE id > ? ORDER BY id ASC LIMIT 200")
      .all(afterId) as unknown as ChatMessageRow[];
  } else {
    rows = db
      .prepare("SELECT * FROM (SELECT * FROM chat_messages ORDER BY id DESC LIMIT 200) ORDER BY id ASC")
      .all() as unknown as ChatMessageRow[];
  }

  const messages = rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    sender: r.sender,
    avatar: r.avatar,
    text: r.text,
    role: r.role,
    createdAt: r.created_at,
  }));

  res.json({ messages });
});

// POST /api/messages
apiRouter.post("/messages", (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  // Rate limit: 30 per minute per user (60,000 ms)
  if (!rateLimiters.chatUser.check(user.id, 30, 60000)) {
    res.status(429).json({ message: "Too many messages. Max 30 messages per minute." });
    return;
  }

  const { text } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim() || text.length > 1000) {
    res.status(400).json({ message: "Text must be between 1 and 1000 characters" });
    return;
  }

  let profileData: Record<string, any> = {};
  try {
    profileData = typeof user.profile === "string" ? JSON.parse(user.profile) : user.profile || {};
  } catch {
    profileData = {};
  }

  const db = getDb();
  const now = new Date().toISOString();
  const cleanText = text.trim();
  const avatar = profileData.avatar || null;

  const insert = db.prepare(`
    INSERT INTO chat_messages (user_id, sender, avatar, text, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(user.id, user.name, avatar, cleanText, user.role, now);

  const insertedMessage = {
    id: Number(result.lastInsertRowid),
    userId: user.id,
    sender: user.name,
    avatar,
    text: cleanText,
    role: user.role,
    createdAt: now,
  };

  res.status(201).json({ message: insertedMessage });
});

// --- ADMIN-ONLY ROUTES (Protected by requireAdmin on server) ---

// GET /api/admin/users
apiRouter.get("/admin/users", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const rows = db.prepare("SELECT id, email, name, student_id, role, created_at FROM users ORDER BY created_at DESC").all();
  res.json({ users: rows });
});

// GET /api/admin/stats
apiRouter.get("/admin/stats", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const usersCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  const messagesCount = db.prepare("SELECT COUNT(*) as count FROM chat_messages").get() as { count: number };
  const sessionsCount = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE expires_at > ?").get(Date.now()) as { count: number };

  res.json({
    stats: {
      totalUsers: usersCount.count,
      totalMessages: messagesCount.count,
      activeSessions: sessionsCount.count,
    },
  });
});

// DELETE /api/admin/messages/:id
apiRouter.delete("/admin/messages/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const msgId = Number(req.params.id);
  if (!msgId || isNaN(msgId)) {
    res.status(400).json({ message: "Invalid message ID" });
    return;
  }
  const db = getDb();
  const result = db.prepare("DELETE FROM chat_messages WHERE id = ?").run(msgId);
  if (result.changes === 0) {
    res.status(404).json({ message: "Message not found" });
    return;
  }
  res.json({ message: "Message deleted successfully by administrator" });
});

// GET /api/admin/backup - Admin only: Exports database (users without password hashes, chat messages)
apiRouter.get("/admin/backup", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  try {
    const backupData = exportDatabaseBackup();
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="vazir-backup-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.json(backupData);
  } catch (err: any) {
    console.error("[CRITICAL BACKUP ERROR] Failed to export database backup:", err);
    res.status(500).json({ message: "Failed to export database backup" });
  }
});

// POST /api/admin/restore - Admin only: Restores database from a JSON backup payload
apiRouter.post("/admin/restore", requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const backupPayload = req.body;
    if (!backupPayload || typeof backupPayload !== "object") {
      res.status(400).json({ message: "Invalid backup data: request body must be a JSON object" });
      return;
    }

    const result = await restoreDatabaseBackup(backupPayload, hashPassword);
    res.json({
      message: "Database backup restored successfully",
      restored: {
        restoredUsers: result.restoredUsers,
        restoredMessages: result.restoredMessages,
      },
      preRestoreBackup: result.preRestoreBackup,
    });
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    // If it's a validation error or bounds error, return 400 Bad Request
    if (
      errorMsg.includes("Invalid") ||
      errorMsg.includes("limit") ||
      errorMsg.includes("exceeded") ||
      errorMsg.includes("pollution") ||
      errorMsg.includes("Duplicate")
    ) {
      res.status(400).json({ message: errorMsg });
      return;
    }

    console.error("[CRITICAL RESTORE ERROR] Failed to restore database backup:", err);
    res.status(500).json({ message: "Failed to restore database backup: " + errorMsg });
  }
});

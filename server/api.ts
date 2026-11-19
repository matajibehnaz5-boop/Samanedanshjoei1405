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

// GET /api/auth/me & GET /api/me (User can strictly read only their own profile)
apiRouter.get("/auth/me", (req: AuthenticatedRequest, res: Response): void => {
  res.json({ user: formatUser(req.user!) });
});

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

// --- EDUCATIONAL AFFAIRS ADMIN ROUTES (Protected by requireAdmin) ---

function normalizeDigitsOnly(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

// GET /api/admin/edu-groups
apiRouter.get("/admin/edu-groups", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT
        g.id,
        g.name,
        g.head,
        g.created_at,
        COUNT(e.id) AS employee_count
      FROM edu_groups g
      LEFT JOIN employees e ON e.group_id = g.id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `)
    .all() as Array<{
      id: string;
      name: string;
      head: string | null;
      created_at: string;
      employee_count: number;
    }>;

  const groups = rows.map((g) => ({
    id: g.id,
    name: g.name,
    head: g.head || "",
    employeeCount: Number(g.employee_count || 0),
    createdAt: g.created_at,
  }));

  res.json({ groups });
});

// POST /api/admin/edu-groups
apiRouter.post("/admin/edu-groups", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { name, head } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "نام گروه آموزشی الزامی است." });
    return;
  }

  const cleanName = name.trim();
  if (cleanName.length > 100) {
    res.status(400).json({ message: "نام گروه آموزشی نباید بیشتر از ۱۰۰ کاراکتر باشد." });
    return;
  }

  let cleanHead: string | null = null;
  if (head !== undefined && head !== null) {
    if (typeof head !== "string") {
      res.status(400).json({ message: "نام مدیر گروه نامعتبر است." });
      return;
    }
    const trimmedHead = head.trim();
    if (trimmedHead.length > 100) {
      res.status(400).json({ message: "نام مدیر گروه نباید بیشتر از ۱۰۰ کاراکتر باشد." });
      return;
    }
    cleanHead = trimmedHead || null;
  }

  const db = getDb();
  const duplicate = db
    .prepare("SELECT id FROM edu_groups WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))")
    .get(cleanName) as { id: string } | undefined;

  if (duplicate) {
    res.status(409).json({ message: "گروه آموزشی با این نام قبلاً ثبت شده است." });
    return;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO edu_groups (id, name, head, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, cleanName, cleanHead, createdAt);

  res.status(201).json({
    group: {
      id,
      name: cleanName,
      head: cleanHead || "",
      employeeCount: 0,
      createdAt,
    },
  });
});

// DELETE /api/admin/edu-groups/:id
apiRouter.delete("/admin/edu-groups/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const groupId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!groupId) {
    res.status(400).json({ message: "شناسه گروه آموزشی نامعتبر است." });
    return;
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM edu_groups WHERE id = ?")
    .get(groupId) as { id: string } | undefined;

  if (!existing) {
    res.status(404).json({ message: "گروه آموزشی مورد نظر یافت نشد." });
    return;
  }

  db.exec("BEGIN IMMEDIATE;");
  try {
    // Preserve employees, professors, and students and unlink their group_id before deleting the group
    db.prepare("UPDATE employees SET group_id = NULL WHERE group_id = ?").run(groupId);
    db.prepare("UPDATE professors SET group_id = NULL WHERE group_id = ?").run(groupId);
    db.prepare("UPDATE students SET group_id = NULL WHERE group_id = ?").run(groupId);
    db.prepare("DELETE FROM edu_groups WHERE id = ?").run(groupId);
    db.exec("COMMIT;");
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // ignore
    }
    throw err;
  }

  res.json({ message: "گروه آموزشی با موفقیت حذف شد." });
});

// GET /api/admin/edu-fields
apiRouter.get("/admin/edu-fields", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT
        f.id,
        f.name,
        f.level,
        f.created_at,
        COUNT(e.id) AS employee_count
      FROM edu_fields f
      LEFT JOIN employees e ON e.field_id = f.id
      GROUP BY f.id, f.name, f.level, f.created_at
      ORDER BY f.created_at DESC
    `)
    .all() as Array<{
      id: string;
      name: string;
      level: string | null;
      created_at: string;
      employee_count: number;
    }>;

  const fields = rows.map((f) => ({
    id: f.id,
    name: f.name,
    level: (f.level || "کارشناسی").trim() || "کارشناسی",
    employeeCount: Number(f.employee_count || 0),
    createdAt: f.created_at,
  }));

  res.json({ fields });
});

// POST /api/admin/edu-fields
apiRouter.post("/admin/edu-fields", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { name, level } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "نام رشته تحصیلی الزامی است." });
    return;
  }

  const cleanName = name.trim();
  if (cleanName.length > 100) {
    res.status(400).json({ message: "نام رشته تحصیلی نباید بیشتر از ۱۰۰ کاراکتر باشد." });
    return;
  }

  const cleanLevel =
    typeof level === "string" && level.trim() ? level.trim() : "کارشناسی";

  const db = getDb();
  const duplicate = db
    .prepare("SELECT id FROM edu_fields WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND level = ?")
    .get(cleanName, cleanLevel) as { id: string } | undefined;

  if (duplicate) {
    res.status(409).json({ message: "رشته تحصیلی با این نام و مقطع قبلاً ثبت شده است." });
    return;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO edu_fields (id, name, level, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, cleanName, cleanLevel, createdAt);

  res.status(201).json({
    field: {
      id,
      name: cleanName,
      level: cleanLevel,
      employeeCount: 0,
      createdAt,
    },
  });
});

// DELETE /api/admin/edu-fields/:id
apiRouter.delete("/admin/edu-fields/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const fieldId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!fieldId) {
    res.status(400).json({ message: "شناسه رشته تحصیلی نامعتبر است." });
    return;
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM edu_fields WHERE id = ?")
    .get(fieldId) as { id: string } | undefined;

  if (!existing) {
    res.status(404).json({ message: "رشته تحصیلی مورد نظر یافت نشد." });
    return;
  }

  db.exec("BEGIN IMMEDIATE;");
  try {
    // Preserve employees, professors, and students and unlink their field_id before deleting the field
    db.prepare("UPDATE employees SET field_id = NULL WHERE field_id = ?").run(fieldId);
    db.prepare("UPDATE professors SET field_id = NULL WHERE field_id = ?").run(fieldId);
    db.prepare("UPDATE students SET field_id = NULL WHERE field_id = ?").run(fieldId);
    db.prepare("DELETE FROM edu_fields WHERE id = ?").run(fieldId);
    db.exec("COMMIT;");
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // ignore
    }
    throw err;
  }

  res.json({ message: "رشته تحصیلی با موفقیت حذف شد." });
});

// GET /api/admin/employees
apiRouter.get("/admin/employees", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT
        e.id,
        e.first_name,
        e.last_name,
        e.national_id,
        e.personnel_code,
        e.phone,
        e.position,
        e.group_id,
        g.name AS group_name,
        e.field_id,
        f.name AS field_name,
        e.created_at
      FROM employees e
      LEFT JOIN edu_groups g ON g.id = e.group_id
      LEFT JOIN edu_fields f ON f.id = e.field_id
      ORDER BY e.created_at DESC
    `)
    .all() as Array<{
      id: string;
      first_name: string;
      last_name: string;
      national_id: string;
      personnel_code: string | null;
      phone: string | null;
      position: string | null;
      group_id: string | null;
      group_name: string | null;
      field_id: string | null;
      field_name: string | null;
      created_at: string;
    }>;

  const employees = rows.map((e) => ({
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
    nationalId: e.national_id,
    personnelCode: e.personnel_code || "",
    phone: e.phone || "",
    position: e.position || "",
    groupId: e.group_id || null,
    groupName: e.group_name || "",
    fieldId: e.field_id || null,
    fieldName: e.field_name || "",
    createdAt: e.created_at,
  }));

  res.json({ employees });
});

// POST /api/admin/employees
apiRouter.post("/admin/employees", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { firstName, lastName, nationalId, personnelCode, phone, position, groupId, fieldId } = req.body || {};

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    res.status(400).json({ message: "نام کارمند الزامی است." });
    return;
  }
  const cleanFirstName = firstName.trim();
  if (cleanFirstName.length > 100) {
    res.status(400).json({ message: "نام کارمند نباید بیشتر از ۱۰۰ کاراکتر باشد." });
    return;
  }

  if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
    res.status(400).json({ message: "نام خانوادگی کارمند الزامی است." });
    return;
  }
  const cleanLastName = lastName.trim();
  if (cleanLastName.length > 100) {
    res.status(400).json({ message: "نام خانوادگی کارمند نباید بیشتر از ۱۰۰ کاراکتر باشد." });
    return;
  }

  if (!nationalId || typeof nationalId !== "string") {
    res.status(400).json({ message: "کد ملی باید دقیقاً ۱۰ رقم باشد." });
    return;
  }
  const cleanNationalId = normalizeDigitsOnly(nationalId.trim());
  if (!/^\d{10}$/.test(cleanNationalId)) {
    res.status(400).json({ message: "کد ملی باید دقیقاً ۱۰ رقم باشد." });
    return;
  }

  let cleanPersonnelCode: string | null = null;
  if (personnelCode !== undefined && personnelCode !== null) {
    if (typeof personnelCode !== "string") {
      res.status(400).json({ message: "کد پرسنلی نامعتبر است." });
      return;
    }
    const trimmed = normalizeDigitsOnly(personnelCode.trim());
    if (trimmed.length > 50) {
      res.status(400).json({ message: "کد پرسنلی نباید بیشتر از ۵۰ کاراکتر باشد." });
      return;
    }
    cleanPersonnelCode = trimmed || null;
  }

  let cleanPhone: string | null = null;
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== "string") {
      res.status(400).json({ message: "شماره تماس نامعتبر است." });
      return;
    }
    const trimmed = normalizeDigitsOnly(phone.trim());
    if (trimmed.length > 30) {
      res.status(400).json({ message: "شماره تماس نباید بیشتر از ۳۰ کاراکتر باشد." });
      return;
    }
    cleanPhone = trimmed || null;
  }

  let cleanPosition: string | null = null;
  if (position !== undefined && position !== null) {
    if (typeof position !== "string") {
      res.status(400).json({ message: "سمت کارمند نامعتبر است." });
      return;
    }
    const trimmed = position.trim();
    if (trimmed.length > 100) {
      res.status(400).json({ message: "سمت کارمند نباید بیشتر از ۱۰۰ کاراکتر باشد." });
      return;
    }
    cleanPosition = trimmed || null;
  }

  const db = getDb();

  let cleanGroupId: string | null = null;
  let groupName = "";
  if (groupId !== undefined && groupId !== null && String(groupId).trim() !== "") {
    if (typeof groupId !== "string") {
      res.status(400).json({ message: "گروه آموزشی انتخاب‌شده نامعتبر است." });
      return;
    }
    const trimmedGroupId = groupId.trim();
    const groupRow = db
      .prepare("SELECT id, name FROM edu_groups WHERE id = ?")
      .get(trimmedGroupId) as { id: string; name: string } | undefined;

    if (!groupRow) {
      res.status(400).json({ message: "گروه آموزشی انتخاب‌شده یافت نشد." });
      return;
    }
    cleanGroupId = groupRow.id;
    groupName = groupRow.name;
  }

  let cleanFieldId: string | null = null;
  let fieldName = "";
  if (fieldId !== undefined && fieldId !== null && String(fieldId).trim() !== "") {
    if (typeof fieldId !== "string") {
      res.status(400).json({ message: "رشته تحصیلی انتخاب‌شده نامعتبر است." });
      return;
    }
    const trimmedFieldId = fieldId.trim();
    const fieldRow = db
      .prepare("SELECT id, name FROM edu_fields WHERE id = ?")
      .get(trimmedFieldId) as { id: string; name: string } | undefined;

    if (!fieldRow) {
      res.status(400).json({ message: "رشته تحصیلی انتخاب‌شده یافت نشد." });
      return;
    }
    cleanFieldId = fieldRow.id;
    fieldName = fieldRow.name;
  }

  const duplicateNationalId = db
    .prepare("SELECT id FROM employees WHERE national_id = ?")
    .get(cleanNationalId) as { id: string } | undefined;

  if (duplicateNationalId) {
    res.status(409).json({ message: "کارمندی با این کد ملی قبلاً ثبت شده است." });
    return;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO employees (id, first_name, last_name, national_id, personnel_code, phone, position, group_id, field_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    cleanFirstName,
    cleanLastName,
    cleanNationalId,
    cleanPersonnelCode,
    cleanPhone,
    cleanPosition,
    cleanGroupId,
    cleanFieldId,
    createdAt
  );

  res.status(201).json({
    employee: {
      id,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      nationalId: cleanNationalId,
      personnelCode: cleanPersonnelCode || "",
      phone: cleanPhone || "",
      position: cleanPosition || "",
      groupId: cleanGroupId,
      groupName,
      fieldId: cleanFieldId,
      fieldName,
      createdAt,
    },
  });
});

// DELETE /api/admin/employees/:id
apiRouter.delete("/admin/employees/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const empId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!empId) {
    res.status(400).json({ message: "شناسه کارمند نامعتبر است." });
    return;
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM employees WHERE id = ?").run(empId);
  if (result.changes === 0) {
    res.status(404).json({ message: "کارمند مورد نظر یافت نشد." });
    return;
  }

  res.json({ message: "کارمند با موفقیت حذف شد." });
});

// --- PROFESSOR SPECIALTIES ADMIN ROUTES (Protected by requireAdmin) ---

// GET /api/admin/professor-specialties
apiRouter.get("/admin/professor-specialties", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT
        s.id,
        s.name,
        s.created_at,
        COUNT(p.id) AS professor_count
      FROM professor_specialties s
      LEFT JOIN professors p ON p.specialty_id = s.id
      GROUP BY s.id, s.name, s.created_at
      ORDER BY s.created_at DESC
    `)
    .all() as Array<{
      id: string;
      name: string;
      created_at: string;
      professor_count: number;
    }>;

  const specialties = rows.map((s) => ({
    id: s.id,
    name: s.name,
    professorCount: Number(s.professor_count || 0),
    createdAt: s.created_at,
  }));

  res.json({ specialties });
});

// POST /api/admin/professor-specialties
apiRouter.post("/admin/professor-specialties", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { name } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "نام تخصص / گرایش الزامی است." });
    return;
  }

  const cleanName = name.trim();
  if (cleanName.length > 100) {
    res.status(400).json({ message: "نام تخصص / گرایش نباید بیشتر از ۱۰۰ کاراکتر باشد." });
    return;
  }

  const db = getDb();
  const duplicate = db
    .prepare("SELECT id FROM professor_specialties WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))")
    .get(cleanName) as { id: string } | undefined;

  if (duplicate) {
    res.status(409).json({ message: "تخصص / گرایش با این نام قبلاً ثبت شده است." });
    return;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO professor_specialties (id, name, created_at)
    VALUES (?, ?, ?)
  `).run(id, cleanName, createdAt);

  res.status(201).json({
    specialty: {
      id,
      name: cleanName,
      professorCount: 0,
      createdAt,
    },
  });
});

// DELETE /api/admin/professor-specialties/:id
apiRouter.delete("/admin/professor-specialties/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const specialtyId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!specialtyId) {
    res.status(400).json({ message: "شناسه تخصص / گرایش نامعتبر است." });
    return;
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM professor_specialties WHERE id = ?")
    .get(specialtyId) as { id: string } | undefined;

  if (!existing) {
    res.status(404).json({ message: "تخصص / گرایش مورد نظر یافت نشد." });
    return;
  }

  db.exec("BEGIN IMMEDIATE;");
  try {
    db.prepare("UPDATE professors SET specialty_id = NULL WHERE specialty_id = ?").run(specialtyId);
    db.prepare("DELETE FROM professor_specialties WHERE id = ?").run(specialtyId);
    db.exec("COMMIT;");
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // ignore
    }
    throw err;
  }

  res.json({ message: "تخصص / گرایش با موفقیت حذف شد." });
});

// --- PROFESSOR AFFAIRS ADMIN ROUTES (Protected by requireAdmin) ---

const ALLOWED_ACADEMIC_RANKS = ["مربی", "استادیار", "دانشیار", "استاد"] as const;
const ALLOWED_ACCESS_LEVELS = ["view", "advisor", "referee", "group_head"] as const;

interface ProfessorDbRow {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string;
  personnel_code: string | null;
  phone: string | null;
  email: string | null;
  academic_rank: string;
  group_id: string | null;
  group_name: string | null;
  field_id: string | null;
  field_name: string | null;
  specialty_id: string | null;
  specialty_name: string | null;
  capacity: number;
  access_level: string;
  created_at: string;
}

function formatProfessorRow(p: ProfessorDbRow) {
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    nationalId: p.national_id,
    personnelCode: p.personnel_code || "",
    phone: p.phone || "",
    email: p.email || "",
    academicRank: p.academic_rank,
    groupId: p.group_id || null,
    groupName: p.group_name || "",
    fieldId: p.field_id || null,
    fieldName: p.field_name || "",
    specialtyId: p.specialty_id || null,
    specialtyName: p.specialty_name || "",
    capacity: Number(p.capacity ?? 0),
    accessLevel: p.access_level || "view",
    createdAt: p.created_at,
  };
}

// GET /api/admin/professors
apiRouter.get("/admin/professors", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.national_id,
        p.personnel_code,
        p.phone,
        p.email,
        p.academic_rank,
        p.group_id,
        g.name AS group_name,
        p.field_id,
        f.name AS field_name,
        p.specialty_id,
        s.name AS specialty_name,
        p.capacity,
        p.access_level,
        p.created_at
      FROM professors p
      LEFT JOIN edu_groups g ON g.id = p.group_id
      LEFT JOIN edu_fields f ON f.id = p.field_id
      LEFT JOIN professor_specialties s ON s.id = p.specialty_id
      ORDER BY p.created_at DESC
    `)
    .all() as unknown as ProfessorDbRow[];

  res.json({ professors: rows.map(formatProfessorRow) });
});

// POST /api/admin/professors
apiRouter.post("/admin/professors", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const {
    firstName,
    lastName,
    nationalId,
    personnelCode,
    phone,
    email,
    academicRank,
    groupId,
    fieldId,
    specialtyId,
    capacity,
    accessLevel,
  } = req.body || {};

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    res.status(400).json({ message: "نام استاد الزامی است." });
    return;
  }
  const cleanFirstName = firstName.trim();
  if (cleanFirstName.length > 100) {
    res.status(400).json({ message: "نام استاد نباید بیشتر از ۱۰۰ کاراکتر باشد." });
    return;
  }

  if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
    res.status(400).json({ message: "نام خانوادگی استاد الزامی است." });
    return;
  }
  const cleanLastName = lastName.trim();
  if (cleanLastName.length > 100) {
    res.status(400).json({ message: "نام خانوادگی استاد نباید بیشتر از ۱۰۰ کاراکتر باشد." });
    return;
  }

  if (!nationalId || typeof nationalId !== "string") {
    res.status(400).json({ message: "کد ملی باید دقیقاً ۱۰ رقم باشد." });
    return;
  }
  const cleanNationalId = normalizeDigitsOnly(nationalId.trim());
  if (!/^\d{10}$/.test(cleanNationalId)) {
    res.status(400).json({ message: "کد ملی باید دقیقاً ۱۰ رقم باشد." });
    return;
  }

  let cleanPersonnelCode: string | null = null;
  if (personnelCode !== undefined && personnelCode !== null) {
    if (typeof personnelCode !== "string") {
      res.status(400).json({ message: "کد پرسنلی نامعتبر است." });
      return;
    }
    const trimmed = normalizeDigitsOnly(personnelCode.trim());
    if (trimmed.length > 50) {
      res.status(400).json({ message: "کد پرسنلی نباید بیشتر از ۵۰ کاراکتر باشد." });
      return;
    }
    cleanPersonnelCode = trimmed || null;
  }

  let cleanPhone: string | null = null;
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== "string") {
      res.status(400).json({ message: "شماره تماس نامعتبر است." });
      return;
    }
    const trimmed = normalizeDigitsOnly(phone.trim());
    if (trimmed.length > 30) {
      res.status(400).json({ message: "شماره تماس نباید بیشتر از ۳۰ کاراکتر باشد." });
      return;
    }
    cleanPhone = trimmed || null;
  }

  let cleanEmail: string | null = null;
  if (email !== undefined && email !== null) {
    if (typeof email !== "string") {
      res.status(400).json({ message: "ایمیل وارد شده نامعتبر است." });
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length > 255) {
      res.status(400).json({ message: "ایمیل نباید بیشتر از ۲۵۵ کاراکتر باشد." });
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      res.status(400).json({ message: "فرمت ایمیل وارد شده معتبر نیست." });
      return;
    }
    cleanEmail = trimmedEmail || null;
  }

  if (
    !academicRank ||
    typeof academicRank !== "string" ||
    !(ALLOWED_ACADEMIC_RANKS as readonly string[]).includes(academicRank.trim())
  ) {
    res.status(400).json({ message: "مرتبه علمی انتخاب‌شده معتبر نیست." });
    return;
  }
  const cleanAcademicRank = academicRank.trim();

  let cleanCapacity = 0;
  if (capacity !== undefined && capacity !== null && String(capacity).trim() !== "") {
    const rawCap = typeof capacity === "string" ? normalizeDigitsOnly(capacity.trim()) : capacity;
    const parsedCap = Number(rawCap);
    if (!Number.isInteger(parsedCap) || parsedCap < 0 || parsedCap > 200) {
      res.status(400).json({ message: "ظرفیت راهنمایی پایان‌نامه باید یک عدد صحیح بین ۰ تا ۲۰۰ باشد." });
      return;
    }
    cleanCapacity = parsedCap;
  }

  let cleanAccessLevel = "view";
  if (accessLevel !== undefined && accessLevel !== null && String(accessLevel).trim() !== "") {
    if (
      typeof accessLevel !== "string" ||
      !(ALLOWED_ACCESS_LEVELS as readonly string[]).includes(accessLevel.trim())
    ) {
      res.status(400).json({ message: "سطح دسترسی انتخاب‌شده معتبر نیست." });
      return;
    }
    cleanAccessLevel = accessLevel.trim();
  }

  const db = getDb();

  let cleanGroupId: string | null = null;
  let groupName = "";
  if (groupId !== undefined && groupId !== null && String(groupId).trim() !== "") {
    if (typeof groupId !== "string") {
      res.status(400).json({ message: "گروه آموزشی انتخاب‌شده نامعتبر است." });
      return;
    }
    const trimmedGroupId = groupId.trim();
    const groupRow = db
      .prepare("SELECT id, name FROM edu_groups WHERE id = ?")
      .get(trimmedGroupId) as { id: string; name: string } | undefined;

    if (!groupRow) {
      res.status(400).json({ message: "گروه آموزشی انتخاب‌شده یافت نشد." });
      return;
    }
    cleanGroupId = groupRow.id;
    groupName = groupRow.name;
  }

  let cleanFieldId: string | null = null;
  let fieldName = "";
  if (fieldId !== undefined && fieldId !== null && String(fieldId).trim() !== "") {
    if (typeof fieldId !== "string") {
      res.status(400).json({ message: "رشته تحصیلی انتخاب‌شده نامعتبر است." });
      return;
    }
    const trimmedFieldId = fieldId.trim();
    const fieldRow = db
      .prepare("SELECT id, name FROM edu_fields WHERE id = ?")
      .get(trimmedFieldId) as { id: string; name: string } | undefined;

    if (!fieldRow) {
      res.status(400).json({ message: "رشته تحصیلی انتخاب‌شده یافت نشد." });
      return;
    }
    cleanFieldId = fieldRow.id;
    fieldName = fieldRow.name;
  }

  let cleanSpecialtyId: string | null = null;
  let specialtyName = "";
  if (specialtyId !== undefined && specialtyId !== null && String(specialtyId).trim() !== "") {
    if (typeof specialtyId !== "string") {
      res.status(400).json({ message: "تخصص / گرایش انتخاب‌شده نامعتبر است." });
      return;
    }
    const trimmedSpecialtyId = specialtyId.trim();
    const specRow = db
      .prepare("SELECT id, name FROM professor_specialties WHERE id = ?")
      .get(trimmedSpecialtyId) as { id: string; name: string } | undefined;

    if (!specRow) {
      res.status(400).json({ message: "تخصص / گرایش انتخاب‌شده یافت نشد." });
      return;
    }
    cleanSpecialtyId = specRow.id;
    specialtyName = specRow.name;
  }

  const duplicateNationalId = db
    .prepare("SELECT id FROM professors WHERE national_id = ?")
    .get(cleanNationalId) as { id: string } | undefined;

  if (duplicateNationalId) {
    res.status(409).json({ message: "استادی با این کد ملی قبلاً ثبت شده است." });
    return;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO professors (
      id, first_name, last_name, national_id, personnel_code, phone, email,
      academic_rank, group_id, field_id, specialty_id, capacity, access_level, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    cleanFirstName,
    cleanLastName,
    cleanNationalId,
    cleanPersonnelCode,
    cleanPhone,
    cleanEmail,
    cleanAcademicRank,
    cleanGroupId,
    cleanFieldId,
    cleanSpecialtyId,
    cleanCapacity,
    cleanAccessLevel,
    createdAt
  );

  res.status(201).json({
    professor: {
      id,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      nationalId: cleanNationalId,
      personnelCode: cleanPersonnelCode || "",
      phone: cleanPhone || "",
      email: cleanEmail || "",
      academicRank: cleanAcademicRank,
      groupId: cleanGroupId,
      groupName,
      fieldId: cleanFieldId,
      fieldName,
      specialtyId: cleanSpecialtyId,
      specialtyName,
      capacity: cleanCapacity,
      accessLevel: cleanAccessLevel,
      createdAt,
    },
  });
});

// DELETE /api/admin/professors/:id
apiRouter.delete("/admin/professors/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const profId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!profId) {
    res.status(400).json({ message: "شناسه استاد نامعتبر است." });
    return;
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM professors WHERE id = ?").run(profId);
  if (result.changes === 0) {
    res.status(404).json({ message: "استاد مورد نظر یافت نشد." });
    return;
  }

  res.json({ message: "استاد با موفقیت حذف شد." });
});

// PATCH /api/admin/professors/:id/access
apiRouter.patch("/admin/professors/:id/access", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const profId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!profId) {
    res.status(400).json({ message: "شناسه استاد نامعتبر است." });
    return;
  }

  const { accessLevel } = req.body || {};
  if (
    !accessLevel ||
    typeof accessLevel !== "string" ||
    !(ALLOWED_ACCESS_LEVELS as readonly string[]).includes(accessLevel.trim())
  ) {
    res.status(400).json({ message: "سطح دسترسی انتخاب‌شده معتبر نیست." });
    return;
  }
  const cleanAccessLevel = accessLevel.trim();

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM professors WHERE id = ?")
    .get(profId) as { id: string } | undefined;

  if (!existing) {
    res.status(404).json({ message: "استاد مورد نظر یافت نشد." });
    return;
  }

  db.prepare("UPDATE professors SET access_level = ? WHERE id = ?").run(cleanAccessLevel, profId);

  const updatedRow = db
    .prepare(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.national_id,
        p.personnel_code,
        p.phone,
        p.email,
        p.academic_rank,
        p.group_id,
        g.name AS group_name,
        p.field_id,
        f.name AS field_name,
        p.specialty_id,
        s.name AS specialty_name,
        p.capacity,
        p.access_level,
        p.created_at
      FROM professors p
      LEFT JOIN edu_groups g ON g.id = p.group_id
      LEFT JOIN edu_fields f ON f.id = p.field_id
      LEFT JOIN professor_specialties s ON s.id = p.specialty_id
      WHERE p.id = ?
    `)
    .get(profId) as unknown as ProfessorDbRow;

  res.json({
    message: "سطح دسترسی استاد با موفقیت به‌روزرسانی شد.",
    professor: formatProfessorRow(updatedRow),
  });
});

// GET /api/admin/professors/:id/theses
apiRouter.get("/admin/professors/:id/theses", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const profId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!profId) {
    res.status(400).json({ message: "شناسه استاد نامعتبر است." });
    return;
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM professors WHERE id = ?")
    .get(profId) as { id: string } | undefined;

  if (!existing) {
    res.status(404).json({ message: "استاد مورد نظر یافت نشد." });
    return;
  }

  res.json({ theses: [] });
});

// --- STUDENT AFFAIRS ADMIN ROUTES (Protected by requireAdmin) ---

interface StudentDbRow {
  id: string;
  first_name: string;
  last_name: string;
  national_id: string;
  student_number: string;
  phone: string | null;
  field_id: string | null;
  field_name: string | null;
  group_id: string | null;
  group_name: string | null;
  created_at: string;
}

function formatStudentRow(s: StudentDbRow) {
  return {
    id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    nationalId: s.national_id,
    studentNumber: s.student_number,
    phone: s.phone || "",
    fieldId: s.field_id || null,
    fieldName: s.field_name || "",
    groupId: s.group_id || null,
    groupName: s.group_name || "",
    createdAt: s.created_at,
  };
}

// GET /api/admin/students?q=
apiRouter.get("/admin/students", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const normalizedQuery = normalizeDigitsOnly(rawQuery);
  const db = getDb();

  let rows: StudentDbRow[];
  if (!normalizedQuery) {
    rows = db
      .prepare(`
        SELECT
          s.id,
          s.first_name,
          s.last_name,
          s.national_id,
          s.student_number,
          s.phone,
          s.field_id,
          f.name AS field_name,
          s.group_id,
          g.name AS group_name,
          s.created_at
        FROM students s
        LEFT JOIN edu_fields f ON f.id = s.field_id
        LEFT JOIN edu_groups g ON g.id = s.group_id
        ORDER BY s.created_at DESC
        LIMIT 50
      `)
      .all() as unknown as StudentDbRow[];
  } else {
    const likePattern = `%${normalizedQuery}%`;
    rows = db
      .prepare(`
        SELECT
          s.id,
          s.first_name,
          s.last_name,
          s.national_id,
          s.student_number,
          s.phone,
          s.field_id,
          f.name AS field_name,
          s.group_id,
          g.name AS group_name,
          s.created_at
        FROM students s
        LEFT JOIN edu_fields f ON f.id = s.field_id
        LEFT JOIN edu_groups g ON g.id = s.group_id
        WHERE s.first_name LIKE ? COLLATE NOCASE
           OR s.last_name LIKE ? COLLATE NOCASE
           OR (s.first_name || ' ' || s.last_name) LIKE ? COLLATE NOCASE
           OR s.national_id LIKE ?
           OR s.student_number LIKE ? COLLATE NOCASE
           OR COALESCE(s.phone, '') LIKE ?
           OR COALESCE(f.name, '') LIKE ? COLLATE NOCASE
           OR COALESCE(g.name, '') LIKE ? COLLATE NOCASE
        ORDER BY s.created_at DESC
        LIMIT 50
      `)
      .all(
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        likePattern,
        likePattern
      ) as unknown as StudentDbRow[];
  }

  res.json({ students: rows.map(formatStudentRow) });
});

// POST /api/admin/students
apiRouter.post("/admin/students", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { firstName, lastName, nationalId, studentNumber, phone, fieldId, groupId } = req.body || {};

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    res.status(400).json({ message: "نام دانشجو الزامی است." });
    return;
  }
  const cleanFirstName = firstName.trim();
  if (cleanFirstName.length > 100) {
    res.status(400).json({ message: "نام دانشجو نباید بیشتر از ۱۰۰ کاراکتر باشد." });
    return;
  }

  if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
    res.status(400).json({ message: "نام خانوادگی دانشجو الزامی است." });
    return;
  }
  const cleanLastName = lastName.trim();
  if (cleanLastName.length > 100) {
    res.status(400).json({ message: "نام خانوادگی دانشجو نباید بیشتر از ۱۰۰ کاراکتر باشد." });
    return;
  }

  if (!nationalId || typeof nationalId !== "string") {
    res.status(400).json({ message: "کد ملی باید دقیقاً ۱۰ رقم باشد." });
    return;
  }
  const cleanNationalId = normalizeDigitsOnly(nationalId.trim());
  if (!/^\d{10}$/.test(cleanNationalId)) {
    res.status(400).json({ message: "کد ملی باید دقیقاً ۱۰ رقم باشد." });
    return;
  }

  if (!studentNumber || typeof studentNumber !== "string" || !studentNumber.trim()) {
    res.status(400).json({ message: "شماره دانشجویی الزامی است." });
    return;
  }
  const cleanStudentNumber = normalizeDigitsOnly(studentNumber.trim());
  if (cleanStudentNumber.length > 50) {
    res.status(400).json({ message: "شماره دانشجویی نباید بیشتر از ۵۰ کاراکتر باشد." });
    return;
  }

  let cleanPhone: string | null = null;
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== "string") {
      res.status(400).json({ message: "شماره تماس نامعتبر است." });
      return;
    }
    const trimmedPhone = normalizeDigitsOnly(phone.trim());
    if (trimmedPhone.length > 30) {
      res.status(400).json({ message: "شماره تماس نباید بیشتر از ۳۰ کاراکتر باشد." });
      return;
    }
    cleanPhone = trimmedPhone || null;
  }

  const db = getDb();

  let cleanFieldId: string | null = null;
  let fieldName = "";
  if (fieldId !== undefined && fieldId !== null && String(fieldId).trim() !== "") {
    if (typeof fieldId !== "string") {
      res.status(400).json({ message: "رشته تحصیلی انتخاب‌شده نامعتبر است." });
      return;
    }
    const trimmedFieldId = fieldId.trim();
    const fieldRow = db
      .prepare("SELECT id, name FROM edu_fields WHERE id = ?")
      .get(trimmedFieldId) as { id: string; name: string } | undefined;

    if (!fieldRow) {
      res.status(400).json({ message: "رشته تحصیلی انتخاب‌شده یافت نشد." });
      return;
    }
    cleanFieldId = fieldRow.id;
    fieldName = fieldRow.name;
  }

  let cleanGroupId: string | null = null;
  let groupName = "";
  if (groupId !== undefined && groupId !== null && String(groupId).trim() !== "") {
    if (typeof groupId !== "string") {
      res.status(400).json({ message: "گروه آموزشی انتخاب‌شده نامعتبر است." });
      return;
    }
    const trimmedGroupId = groupId.trim();
    const groupRow = db
      .prepare("SELECT id, name FROM edu_groups WHERE id = ?")
      .get(trimmedGroupId) as { id: string; name: string } | undefined;

    if (!groupRow) {
      res.status(400).json({ message: "گروه آموزشی انتخاب‌شده یافت نشد." });
      return;
    }
    cleanGroupId = groupRow.id;
    groupName = groupRow.name;
  }

  const duplicateNationalId = db
    .prepare("SELECT id FROM students WHERE national_id = ?")
    .get(cleanNationalId) as { id: string } | undefined;

  if (duplicateNationalId) {
    res.status(409).json({ message: "دانشجویی با این کد ملی قبلاً ثبت شده است." });
    return;
  }

  const duplicateStudentNumber = db
    .prepare("SELECT id FROM students WHERE student_number = ?")
    .get(cleanStudentNumber) as { id: string } | undefined;

  if (duplicateStudentNumber) {
    res.status(409).json({ message: "دانشجویی با این شماره دانشجویی قبلاً ثبت شده است." });
    return;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO students (
      id, first_name, last_name, national_id, student_number, phone, field_id, group_id, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    cleanFirstName,
    cleanLastName,
    cleanNationalId,
    cleanStudentNumber,
    cleanPhone,
    cleanFieldId,
    cleanGroupId,
    createdAt
  );

  res.status(201).json({
    student: {
      id,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      nationalId: cleanNationalId,
      studentNumber: cleanStudentNumber,
      phone: cleanPhone || "",
      fieldId: cleanFieldId,
      fieldName,
      groupId: cleanGroupId,
      groupName,
      createdAt,
    },
  });
});

// POST /api/admin/students/bulk
apiRouter.post("/admin/students/bulk", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { rows } = req.body || {};

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ message: "فایل اکسل حاوی هیچ ردیف دانشجویی نیست." });
    return;
  }

  if (rows.length > 5000) {
    res.status(400).json({ message: "حداکثر ۵۰۰۰ ردیف دانشجو در هر بار بارگذاری مجاز است." });
    return;
  }

  const db = getDb();

  // Preload fields & groups maps (by normalized lowercase name)
  const fieldRows = db.prepare("SELECT id, name FROM edu_fields").all() as Array<{ id: string; name: string }>;
  const groupRows = db.prepare("SELECT id, name FROM edu_groups").all() as Array<{ id: string; name: string }>;
  const fieldMapByName = new Map<string, string>();
  for (const f of fieldRows) {
    fieldMapByName.set(f.name.trim().toLowerCase(), f.id);
  }
  const groupMapByName = new Map<string, string>();
  for (const g of groupRows) {
    groupMapByName.set(g.name.trim().toLowerCase(), g.id);
  }

  // Preload existing national IDs and student numbers
  const existingStudents = db
    .prepare("SELECT national_id, student_number FROM students")
    .all() as Array<{ national_id: string; student_number: string }>;
  const existingNationalIds = new Set<string>(existingStudents.map((s) => s.national_id));
  const existingStudentNumbers = new Set<string>(existingStudents.map((s) => s.student_number));

  let insertedCount = 0;
  let duplicateCount = 0;
  const errors: Array<{ rowNumber: number; reason: string }> = [];

  db.exec("BEGIN IMMEDIATE;");
  try {
    const insertStmt = db.prepare(`
      INSERT INTO students (
        id, first_name, last_name, national_id, student_number, phone, field_id, group_id, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i] || {};
      const rowNumber =
        typeof item.rowNumber === "number" && Number.isInteger(item.rowNumber) && item.rowNumber > 0
          ? item.rowNumber
          : i + 2;

      const rawFirstName = item.firstName !== undefined && item.firstName !== null ? String(item.firstName).trim() : "";
      const rawLastName = item.lastName !== undefined && item.lastName !== null ? String(item.lastName).trim() : "";
      const rawNationalId = item.nationalId !== undefined && item.nationalId !== null ? normalizeDigitsOnly(String(item.nationalId).trim()) : "";
      const rawStudentNumber = item.studentNumber !== undefined && item.studentNumber !== null ? normalizeDigitsOnly(String(item.studentNumber).trim()) : "";
      const rawPhone = item.phone !== undefined && item.phone !== null ? normalizeDigitsOnly(String(item.phone).trim()) : "";
      const rawFieldName = item.fieldName !== undefined && item.fieldName !== null ? String(item.fieldName).trim() : "";
      const rawGroupName = item.groupName !== undefined && item.groupName !== null ? String(item.groupName).trim() : "";

      if (!rawFirstName) {
        errors.push({ rowNumber, reason: "نام دانشجو وارد نشده است." });
        continue;
      }
      if (rawFirstName.length > 100) {
        errors.push({ rowNumber, reason: "نام دانشجو بیشتر از ۱۰۰ کاراکتر است." });
        continue;
      }

      if (!rawLastName) {
        errors.push({ rowNumber, reason: "نام خانوادگی دانشجو وارد نشده است." });
        continue;
      }
      if (rawLastName.length > 100) {
        errors.push({ rowNumber, reason: "نام خانوادگی دانشجو بیشتر از ۱۰۰ کاراکتر است." });
        continue;
      }

      if (!/^\d{10}$/.test(rawNationalId)) {
        errors.push({ rowNumber, reason: "کد ملی باید دقیقاً ۱۰ رقم باشد." });
        continue;
      }

      if (!rawStudentNumber) {
        errors.push({ rowNumber, reason: "شماره دانشجویی وارد نشده است." });
        continue;
      }
      if (rawStudentNumber.length > 50) {
        errors.push({ rowNumber, reason: "شماره دانشجویی بیشتر از ۵۰ کاراکتر است." });
        continue;
      }

      if (rawPhone.length > 30) {
        errors.push({ rowNumber, reason: "شماره تماس بیشتر از ۳۰ کاراکتر است." });
        continue;
      }

      let resolvedFieldId: string | null = null;
      if (rawFieldName) {
        const matchedFieldId = fieldMapByName.get(rawFieldName.toLowerCase());
        if (!matchedFieldId) {
          errors.push({ rowNumber, reason: `رشته تحصیلی «${rawFieldName}» در سامانه ثبت نشده است.` });
          continue;
        }
        resolvedFieldId = matchedFieldId;
      }

      let resolvedGroupId: string | null = null;
      if (rawGroupName) {
        const matchedGroupId = groupMapByName.get(rawGroupName.toLowerCase());
        if (!matchedGroupId) {
          errors.push({ rowNumber, reason: `گروه آموزشی «${rawGroupName}» در سامانه ثبت نشده است.` });
          continue;
        }
        resolvedGroupId = matchedGroupId;
      }

      if (existingNationalIds.has(rawNationalId)) {
        duplicateCount++;
        continue;
      }

      if (existingStudentNumbers.has(rawStudentNumber)) {
        duplicateCount++;
        continue;
      }

      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      insertStmt.run(
        id,
        rawFirstName,
        rawLastName,
        rawNationalId,
        rawStudentNumber,
        rawPhone || null,
        resolvedFieldId,
        resolvedGroupId,
        createdAt
      );

      existingNationalIds.add(rawNationalId);
      existingStudentNumbers.add(rawStudentNumber);
      insertedCount++;
    }

    db.exec("COMMIT;");
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // ignore
    }
    throw err;
  }

  res.status(200).json({
    insertedCount,
    duplicateCount,
    errorCount: errors.length,
    errors,
  });
});

// DELETE /api/admin/students/:id
apiRouter.delete("/admin/students/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const studentId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!studentId) {
    res.status(400).json({ message: "شناسه دانشجو نامعتبر است." });
    return;
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM students WHERE id = ?").run(studentId);
  if (result.changes === 0) {
    res.status(404).json({ message: "دانشجو مورد نظر یافت نشد." });
    return;
  }

  res.json({ message: "دانشجو با موفقیت حذف شد." });
});

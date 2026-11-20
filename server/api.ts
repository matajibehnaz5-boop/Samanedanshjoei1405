import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
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

// Every route in apiRouter EXCEPT register, login, sso-login, and health requires a logged-in session
apiRouter.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (
    req.path === "/auth/register" ||
    req.path === "/auth/login" ||
    req.path === "/auth/sso-login" ||
    req.path === "/health"
  ) {
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

// POST /api/auth/sso-login
apiRouter.post("/auth/sso-login", async (req: Request, res: Response): Promise<void> => {
  const { username, password, role } = req.body || {};

  if (role !== undefined && role !== null && String(role).trim() !== "" && String(role).trim() !== "student") {
    res.status(403).json({ message: "ورود از درگاه یکپارچه فقط برای نقش دانشجو مجاز است." });
    return;
  }

  if (!username || !password || typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ message: "لطفاً نام کاربری و رمز عبور را وارد نمایید." });
    return;
  }

  const cleanUsername = normalizeDigitsOnly(username.trim());
  if (!cleanUsername || cleanUsername.length > 100 || password.length > 128) {
    res.status(400).json({ message: "نام کاربری یا رمز عبور نامعتبر است." });
    return;
  }

  const ip = getClientIp(req);
  const fifteenMinutesMs = 15 * 60 * 1000;
  if (!rateLimiters.loginIp.check(ip, 10, fifteenMinutesMs)) {
    res.status(429).json({ message: "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید." });
    return;
  }
  if (!rateLimiters.loginEmail.check(`sso:${cleanUsername.toLowerCase()}`, 10, fifteenMinutesMs)) {
    res.status(429).json({ message: "تعداد تلاش‌های ورود برای این حساب بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید." });
    return;
  }

  const db = getDb();
  const student = db
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
        s.username,
        s.password_hash
      FROM students s
      LEFT JOIN edu_fields f ON f.id = s.field_id
      WHERE s.username = ?
    `)
    .get(cleanUsername) as
    | {
        id: string;
        first_name: string;
        last_name: string;
        national_id: string;
        student_number: string;
        phone: string | null;
        field_id: string | null;
        field_name: string | null;
        username: string | null;
        password_hash: string | null;
      }
    | undefined;

  if (!student || !student.password_hash) {
    res.status(401).json({ message: "نام کاربری یا رمز عبور اشتباه است." });
    return;
  }

  const normalizedPass = normalizeDigitsOnly(password);
  let isValid = await bcrypt.compare(password, student.password_hash);
  if (!isValid && normalizedPass !== password) {
    isValid = await bcrypt.compare(normalizedPass, student.password_hash);
  }

  if (!isValid) {
    res.status(401).json({ message: "نام کاربری یا رمز عبور اشتباه است." });
    return;
  }

  // Ensure a matching student account exists in users table and strictly enforce student role
  const ssoInternalEmail = `${cleanUsername.toLowerCase()}@student.sso.local`;
  let userRow = db
    .prepare(`
      SELECT * FROM users
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
         OR (student_id IS NOT NULL AND TRIM(student_id) = TRIM(?))
      LIMIT 1
    `)
    .get(ssoInternalEmail, student.student_number) as unknown as UserRow | undefined;

  if (userRow && userRow.role !== "student") {
    res.status(403).json({ message: "ورود از درگاه یکپارچه فقط برای نقش دانشجو مجاز است." });
    return;
  }

  const fullName = `${student.first_name} ${student.last_name}`.trim() || "آیدین رستمی";

  if (!userRow) {
    const newUserId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const initialProfile = JSON.stringify({
      field: student.field_name || "مهندسی کامپیوتر",
      phone: student.phone || "",
    });
    const sessionPlaceholderHash = await hashPassword(crypto.randomUUID());

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, student_id, role, profile, created_at)
      VALUES (?, ?, ?, ?, ?, 'student', ?, ?)
    `).run(newUserId, ssoInternalEmail, sessionPlaceholderHash, fullName, student.student_number, initialProfile, nowIso);

    userRow = db.prepare("SELECT * FROM users WHERE id = ?").get(newUserId) as unknown as UserRow;
  } else if (userRow.name === "دانشجوی نمونه" && fullName && fullName !== "دانشجوی نمونه") {
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(fullName, userRow.id);
    userRow = db.prepare("SELECT * FROM users WHERE id = ?").get(userRow.id) as unknown as UserRow;
  }

  const sessionId = createSession(userRow.id);
  setSessionCookie(res, req, sessionId);

  res.json({ user: formatUser(userRow) });
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

function generateTemporaryPassword(length = 8): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const chars = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
  ];
  for (let i = chars.length; i < length; i++) {
    chars.push(all[crypto.randomInt(all.length)]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// GET /api/admin/users
apiRouter.get("/admin/users", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, email, name, student_id, role, locked_until, created_at FROM users ORDER BY created_at DESC")
    .all() as Array<{
      id: string;
      email: string;
      name: string;
      student_id: string | null;
      role: string;
      locked_until?: number | null;
      created_at: string;
    }>;

  const nowMs = Date.now();
  const currentAdminId = req.user?.id || "";

  const users = rows.map((u) => {
    const isLocked = Number(u.locked_until || 0) > nowMs;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      student_id: u.student_id,
      studentId: u.student_id || "",
      role: u.role,
      status: isLocked ? "locked" : "active",
      isSelf: u.id === currentAdminId,
      created_at: u.created_at,
      createdAt: u.created_at,
    };
  });

  res.json({ users });
});

// POST /api/admin/users/:id/reset-password
apiRouter.post("/admin/users/:id/reset-password", requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const targetUserId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!targetUserId) {
    res.status(400).json({ message: "شناسه کاربر نامعتبر است." });
    return;
  }

  const currentAdminId = req.user?.id || "";
  if (targetUserId === currentAdminId) {
    res.status(403).json({ message: "امکان بازنشانی رمز عبور حساب ادمین فعلی از این بخش وجود ندارد." });
    return;
  }

  const db = getDb();
  const targetUser = db
    .prepare("SELECT id, role, name, email FROM users WHERE id = ?")
    .get(targetUserId) as { id: string; role: string; name: string; email: string } | undefined;

  if (!targetUser) {
    res.status(404).json({ message: "کاربر مورد نظر یافت نشد." });
    return;
  }

  const tempPassword = generateTemporaryPassword(8);
  const passwordHash = await hashPassword(tempPassword);
  const logId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  db.exec("BEGIN IMMEDIATE;");
  try {
    db.prepare(
      "UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = 0 WHERE id = ?"
    ).run(passwordHash, targetUserId);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(targetUserId);
    db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_id, action, target_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(logId, currentAdminId, "reset_password", targetUserId, nowIso);
    createAdminNotification(db, {
      type: "system",
      title: "بازنشانی رمز عبور انجام شد",
      body: `رمز عبور موقت برای کاربر «${targetUser.name || targetUser.email}» صادر گردید.`,
      targetModal: "admin_users",
      createdAt: nowIso,
    });
    db.exec("COMMIT;");
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // ignore
    }
    throw err;
  }

  res.json({
    temporaryPassword: tempPassword,
    message: "رمز عبور موقت با موفقیت ایجاد شد.",
  });
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

// GET /api/admin/overview
apiRouter.get("/admin/overview", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const db = getDb();

    const studentsRow = db.prepare("SELECT COUNT(*) AS count FROM students").get() as { count: number } | undefined;
    const professorsRow = db.prepare("SELECT COUNT(*) AS count FROM professors").get() as { count: number } | undefined;
    const employeesRow = db.prepare("SELECT COUNT(*) AS count FROM employees").get() as { count: number } | undefined;
    const activeThesesRow = db
      .prepare("SELECT COUNT(*) AS count FROM theses WHERE status != 'دفاع شده'")
      .get() as { count: number } | undefined;

    const currentUserId = req.user?.id || "";
    const unreadMsgRow = db
      .prepare("SELECT COUNT(*) AS count FROM chat_messages WHERE user_id != ?")
      .get(currentUserId) as { count: number } | undefined;

    const defenseSessionRows = db
      .prepare(`
        SELECT
          ds.id,
          COALESCE(t.title, 'پایان‌نامه ثبت‌نشده') AS title,
          COALESCE(NULLIF(TRIM(s.first_name || ' ' || s.last_name), ''), 'نامشخص') AS student_name,
          ds.date,
          ds.time,
          ds.location
        FROM defense_sessions ds
        LEFT JOIN theses t ON t.id = ds.thesis_id
        LEFT JOIN students s ON s.id = t.student_id
        WHERE ds.status = 'برنامه‌ریزی‌شده'
        ORDER BY ds.date ASC, ds.time ASC
        LIMIT 5
      `)
      .all() as Array<{
        id: string;
        title: string;
        student_name: string;
        date: string;
        time: string;
        location: string;
      }>;

    const activityRows = db
      .prepare(`
        SELECT id, type, title, subtitle, created_at FROM (
          SELECT
            id,
            'employee' AS type,
            ('ثبت کارمند: ' || first_name || ' ' || last_name) AS title,
            COALESCE(NULLIF(TRIM(position), ''), 'کارمند آموزش') AS subtitle,
            created_at
          FROM employees
          UNION ALL
          SELECT
            id,
            'edu_group' AS type,
            ('ثبت گروه آموزشی: ' || name) AS title,
            COALESCE(NULLIF(TRIM(head), ''), 'گروه آموزشی') AS subtitle,
            created_at
          FROM edu_groups
          UNION ALL
          SELECT
            id,
            'professor' AS type,
            ('ثبت استاد: ' || first_name || ' ' || last_name) AS title,
            COALESCE(NULLIF(TRIM(academic_rank), ''), 'عضو هیئت علمی') AS subtitle,
            created_at
          FROM professors
          UNION ALL
          SELECT
            id,
            'student' AS type,
            ('ثبت دانشجو: ' || first_name || ' ' || last_name) AS title,
            ('شماره دانشجویی: ' || student_number) AS subtitle,
            created_at
          FROM students
          UNION ALL
          SELECT
            id,
            'thesis' AS type,
            ('ثبت پایان‌نامه: ' || title) AS title,
            ('وضعیت: ' || status) AS subtitle,
            created_at
          FROM theses
          UNION ALL
          SELECT
            ds.id,
            'defense_session' AS type,
            ('جلسه دفاع: ' || COALESCE(t.title, 'پایان‌نامه')) AS title,
            (ds.date || ' ساعت ' || ds.time || ' - ' || ds.location) AS subtitle,
            ds.created_at
          FROM defense_sessions ds
          LEFT JOIN theses t ON t.id = ds.thesis_id
        )
        ORDER BY created_at DESC
        LIMIT 5
      `)
      .all() as Array<{
        id: string;
        type: "employee" | "edu_group" | "professor" | "student" | "thesis" | "defense_session";
        title: string;
        subtitle: string;
        created_at: string;
      }>;

    res.json({
      stats: {
        studentsCount: Number(studentsRow?.count ?? 0),
        professorsCount: Number(professorsRow?.count ?? 0),
        employeesCount: Number(employeesRow?.count ?? 0),
        activeThesesCount: Number(activeThesesRow?.count ?? 0),
      },
      pending: {
        pendingRequestsCount: 0,
        unreadMessagesCount: Number(unreadMsgRow?.count ?? 0),
      },
      defenseSessions: defenseSessionRows.map((row) => ({
        id: row.id,
        title: row.title,
        studentName: row.student_name,
        dateTime: `${row.date} • ${row.time}`,
        location: row.location,
      })),
      recentActivities: activityRows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        subtitle: row.subtitle,
        createdAt: row.created_at,
      })),
    });
  } catch (err: any) {
    console.error("[ADMIN OVERVIEW ERROR]:", err);
    res.status(500).json({ message: "خطا در دریافت خلاصه وضعیت مدیریت" });
  }
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

  createAdminNotification(db, {
    type: "registrations",
    title: "ثبت‌نام کارمند جدید",
    body: `${cleanFirstName} ${cleanLastName}${cleanPosition ? ` (${cleanPosition})` : ""} ثبت شد.`,
    targetModal: "employee_list",
    dedupeKey: `reg:employee:${id}`,
    createdAt,
  });

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

  createAdminNotification(db, {
    type: "registrations",
    title: "ثبت‌نام استاد جدید",
    body: `${cleanFirstName} ${cleanLastName} (${cleanAcademicRank}) به لیست اساتید اضافه شد.`,
    targetModal: "professor_list",
    dedupeKey: `reg:professor:${id}`,
    createdAt,
  });

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

// GET /api/admin/professors/capacity
apiRouter.get("/admin/professors/capacity", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.academic_rank,
        g.name AS group_name,
        p.capacity,
        COUNT(CASE WHEN t.id IS NOT NULL AND t.status != 'دفاع شده' THEN 1 END) AS current_theses_count
      FROM professors p
      LEFT JOIN edu_groups g ON g.id = p.group_id
      LEFT JOIN theses t ON t.supervisor_id = p.id
      GROUP BY p.id, p.first_name, p.last_name, p.academic_rank, g.name, p.capacity, p.created_at
      ORDER BY p.created_at DESC
    `)
    .all() as Array<{
      id: string;
      first_name: string;
      last_name: string;
      academic_rank: string;
      group_name: string | null;
      capacity: number;
      current_theses_count: number;
    }>;

  const professors = rows.map((p) => {
    const totalCapacity = Number(p.capacity ?? 0);
    const currentThesesCount = Number(p.current_theses_count ?? 0);
    const remainingCapacity = Math.max(0, totalCapacity - currentThesesCount);
    return {
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      academicRank: p.academic_rank,
      groupName: p.group_name || "",
      totalCapacity,
      currentThesesCount,
      remainingCapacity,
    };
  });

  res.json({ professors });
});

// PATCH /api/admin/professors/:id/capacity
apiRouter.patch("/admin/professors/:id/capacity", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const profId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!profId) {
    res.status(400).json({ message: "شناسه استاد نامعتبر است." });
    return;
  }

  const { capacity } = req.body || {};
  if (capacity === undefined || capacity === null || String(capacity).trim() === "") {
    res.status(400).json({ message: "مقدار ظرفیت استاد الزامی است." });
    return;
  }

  const rawCap = typeof capacity === "string" ? normalizeDigitsOnly(capacity.trim()) : capacity;
  const parsedCap = Number(rawCap);
  if (!Number.isInteger(parsedCap) || parsedCap < 0 || parsedCap > 50) {
    res.status(400).json({ message: "ظرفیت استاد باید یک عدد صحیح بین ۰ تا ۵۰ باشد." });
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

  db.prepare("UPDATE professors SET capacity = ? WHERE id = ?").run(parsedCap, profId);

  const row = db
    .prepare(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.academic_rank,
        g.name AS group_name,
        p.capacity,
        COUNT(CASE WHEN t.id IS NOT NULL AND t.status != 'دفاع شده' THEN 1 END) AS current_theses_count
      FROM professors p
      LEFT JOIN edu_groups g ON g.id = p.group_id
      LEFT JOIN theses t ON t.supervisor_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, p.first_name, p.last_name, p.academic_rank, g.name, p.capacity
    `)
    .get(profId) as {
      id: string;
      first_name: string;
      last_name: string;
      academic_rank: string;
      group_name: string | null;
      capacity: number;
      current_theses_count: number;
    };

  const totalCapacity = Number(row.capacity ?? 0);
  const currentThesesCount = Number(row.current_theses_count ?? 0);

  res.json({
    message: "ظرفیت استاد با موفقیت به‌روزرسانی شد.",
    professor: {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      academicRank: row.academic_rank,
      groupName: row.group_name || "",
      totalCapacity,
      currentThesesCount,
      remainingCapacity: Math.max(0, totalCapacity - currentThesesCount),
    },
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

  const advisorRows = db
    .prepare(`
      SELECT
        t.id,
        t.title,
        t.status,
        COALESCE(NULLIF(TRIM(s.first_name || ' ' || s.last_name), ''), 'نامشخص') AS student_name
      FROM theses t
      LEFT JOIN students s ON s.id = t.student_id
      WHERE t.supervisor_id = ?
      ORDER BY t.created_at DESC
    `)
    .all(profId) as Array<{ id: string; title: string; status: string; student_name: string }>;

  const refereeRows = db
    .prepare(`
      SELECT
        t.id AS thesis_id,
        ds.id AS session_id,
        t.title,
        t.status,
        COALESCE(NULLIF(TRIM(s.first_name || ' ' || s.last_name), ''), 'نامشخص') AS student_name
      FROM defense_sessions ds
      INNER JOIN theses t ON t.id = ds.thesis_id
      LEFT JOIN students s ON s.id = t.student_id
      WHERE ds.referee_id = ? AND ds.status != 'لغو'
      ORDER BY ds.created_at DESC
    `)
    .all(profId) as Array<{
      thesis_id: string;
      session_id: string;
      title: string;
      status: string;
      student_name: string;
    }>;

  const theses = [
    ...advisorRows.map((row) => ({
      id: row.id,
      title: row.title,
      studentName: row.student_name,
      role: "advisor" as const,
      status: row.status,
    })),
    ...refereeRows.map((row) => ({
      id: `${row.thesis_id}-ref-${row.session_id}`,
      title: row.title,
      studentName: row.student_name,
      role: "referee" as const,
      status: row.status,
    })),
  ];

  res.json({ theses });
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

  createAdminNotification(db, {
    type: "registrations",
    title: "ثبت‌نام دانشجوی جدید",
    body: `${cleanFirstName} ${cleanLastName} (شماره دانشجویی: ${cleanStudentNumber}) ثبت شد.`,
    targetModal: "student_search",
    dedupeKey: `reg:student:${id}`,
    createdAt,
  });

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

  if (insertedCount > 0) {
    createAdminNotification(db, {
      type: "registrations",
      title: "ثبت‌نام گروهی دانشجویان",
      body: `${insertedCount} دانشجوی جدید از فایل اکسل در سامانه ثبت شد.`,
      targetModal: "student_search",
    });
  }
  if (errors.length > 0) {
    createAdminNotification(db, {
      type: "system",
      title: "ثبت‌نام گروهی تمام‌شده با خطا",
      body: `ثبت‌نام گروهی با ${errors.length} ردیف دارای خطا (${insertedCount} موفق، ${duplicateCount} تکراری) پایان یافت.`,
      targetModal: "student_bulk_register",
    });
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

// --- THESES ADMIN ROUTES (Protected by requireAdmin) ---

const ALLOWED_THESIS_STATUSES = ["در حال انجام", "تأیید شده", "دفاع شده"] as const;

function normalizeThesisStatus(raw: unknown): (typeof ALLOWED_THESIS_STATUSES)[number] | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\u200c/g, "");
  if (trimmed === "در حال انجام") return "در حال انجام";
  if (trimmed === "تأیید شده" || trimmed === "تایید شده") return "تأیید شده";
  if (trimmed === "دفاع شده") return "دفاع شده";
  return null;
}

interface ThesisDbRow {
  id: string;
  title: string;
  student_id: string | null;
  student_name: string | null;
  student_number: string | null;
  supervisor_id: string | null;
  supervisor_name: string | null;
  status: string;
  created_at: string;
}

function formatThesisRow(t: ThesisDbRow) {
  return {
    id: t.id,
    title: t.title,
    studentId: t.student_id || null,
    studentName: (t.student_name || "").trim() || "تعیین نشده",
    studentNumber: t.student_number || "",
    supervisorId: t.supervisor_id || null,
    supervisorName: (t.supervisor_name || "").trim() || "تعیین نشده",
    status: t.status,
    createdAt: t.created_at,
  };
}

// GET /api/admin/theses
apiRouter.get("/admin/theses", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const rawStatus = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const normalizedStatus = rawStatus ? normalizeThesisStatus(rawStatus) : null;

  const db = getDb();
  let rows = db
    .prepare(`
      SELECT
        t.id,
        t.title,
        t.student_id,
        (COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) AS student_name,
        s.student_number,
        t.supervisor_id,
        (COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) AS supervisor_name,
        t.status,
        t.created_at
      FROM theses t
      LEFT JOIN students s ON s.id = t.student_id
      LEFT JOIN professors p ON p.id = t.supervisor_id
      ORDER BY t.created_at DESC
    `)
    .all() as unknown as ThesisDbRow[];

  if (normalizedStatus) {
    rows = rows.filter((r) => r.status === normalizedStatus);
  }

  if (rawQuery) {
    const q = normalizeDigitsOnly(rawQuery).toLowerCase();
    rows = rows.filter((r) => {
      const title = (r.title || "").toLowerCase();
      const stName = (r.student_name || "").toLowerCase();
      const supName = (r.supervisor_name || "").toLowerCase();
      return title.includes(q) || stName.includes(q) || supName.includes(q);
    });
  }

  res.json({ theses: rows.map(formatThesisRow) });
});

// POST /api/admin/theses
apiRouter.post("/admin/theses", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { title, studentId, supervisorId, status } = req.body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ message: "عنوان پایان‌نامه الزامی است." });
    return;
  }
  const cleanTitle = title.trim();
  if (cleanTitle.length > 200) {
    res.status(400).json({ message: "عنوان پایان‌نامه نباید بیشتر از ۲۰۰ کاراکتر باشد." });
    return;
  }

  let cleanStatus: (typeof ALLOWED_THESIS_STATUSES)[number] = "در حال انجام";
  if (status !== undefined && status !== null && String(status).trim() !== "") {
    const parsedStatus = normalizeThesisStatus(status);
    if (!parsedStatus) {
      res.status(400).json({ message: "وضعیت پایان‌نامه معتبر نیست." });
      return;
    }
    cleanStatus = parsedStatus;
  }

  const db = getDb();

  let cleanStudentId: string | null = null;
  if (studentId !== undefined && studentId !== null && String(studentId).trim() !== "") {
    if (typeof studentId !== "string") {
      res.status(400).json({ message: "شناسه دانشجو نامعتبر است." });
      return;
    }
    const trimmedStudentId = studentId.trim();
    const studentRow = db
      .prepare("SELECT id FROM students WHERE id = ?")
      .get(trimmedStudentId) as { id: string } | undefined;
    if (!studentRow) {
      res.status(400).json({ message: "دانشجوی انتخاب‌شده یافت نشد." });
      return;
    }
    cleanStudentId = studentRow.id;
  }

  let cleanSupervisorId: string | null = null;
  if (supervisorId !== undefined && supervisorId !== null && String(supervisorId).trim() !== "") {
    if (typeof supervisorId !== "string") {
      res.status(400).json({ message: "شناسه استاد راهنما نامعتبر است." });
      return;
    }
    const trimmedSupervisorId = supervisorId.trim();
    const profRow = db
      .prepare("SELECT id FROM professors WHERE id = ?")
      .get(trimmedSupervisorId) as { id: string } | undefined;
    if (!profRow) {
      res.status(400).json({ message: "استاد راهنمای انتخاب‌شده یافت نشد." });
      return;
    }
    cleanSupervisorId = profRow.id;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO theses (id, title, student_id, supervisor_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, cleanTitle, cleanStudentId, cleanSupervisorId, cleanStatus, createdAt);

  const createdRow = db
    .prepare(`
      SELECT
        t.id,
        t.title,
        t.student_id,
        (COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) AS student_name,
        s.student_number,
        t.supervisor_id,
        (COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) AS supervisor_name,
        t.status,
        t.created_at
      FROM theses t
      LEFT JOIN students s ON s.id = t.student_id
      LEFT JOIN professors p ON p.id = t.supervisor_id
      WHERE t.id = ?
    `)
    .get(id) as unknown as ThesisDbRow;

  createAdminNotification(db, {
    type: "theses",
    title: "پایان‌نامه جدید ثبت شد",
    body: `پایان‌نامه «${cleanTitle}» با وضعیت «${cleanStatus}» ثبت گردید.`,
    targetModal: "thesis_list",
    dedupeKey: `thesis:created:${id}`,
    createdAt,
  });

  res.status(201).json({
    thesis: formatThesisRow(createdRow),
    message: "پایان‌نامه با موفقیت ثبت شد.",
  });
});

// DELETE /api/admin/theses/:id
apiRouter.delete("/admin/theses/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const thesisId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!thesisId) {
    res.status(400).json({ message: "شناسه پایان‌نامه نامعتبر است." });
    return;
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM theses WHERE id = ?").run(thesisId);
  if (result.changes === 0) {
    res.status(404).json({ message: "پایان‌نامه مورد نظر یافت نشد." });
    return;
  }

  res.json({ message: "پایان‌نامه با موفقیت حذف شد." });
});

// --- DEFENSE SESSIONS ADMIN ROUTES (Protected by requireAdmin) ---

const ALLOWED_DEFENSE_STATUSES = ["برنامه‌ریزی‌شده", "برگزار شد", "لغو"] as const;

function normalizeDefenseStatus(raw: unknown): (typeof ALLOWED_DEFENSE_STATUSES)[number] | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\u200c/g, "");
  if (trimmed === "برنامهریزی‌شده" || trimmed === "برنامهریزیشده" || trimmed === "برنامه‌ریزی شده") {
    return "برنامه‌ریزی‌شده";
  }
  if (trimmed === "برگزار شد") return "برگزار شد";
  if (trimmed === "لغو") return "لغو";
  return null;
}

function normalizeDefenseDate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = normalizeDigitsOnly(raw.trim()).replace(/-/g, "/");
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(cleaned);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  if (year >= 1300 && year <= 1500) {
    if (month >= 7 && day > 30) return null;
    if (month === 12 && day > 30) return null;
  } else if (year >= 2000 && year <= 2100) {
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (
      dt.getUTCFullYear() !== year ||
      dt.getUTCMonth() !== month - 1 ||
      dt.getUTCDate() !== day
    ) {
      return null;
    }
  } else {
    return null;
  }

  return `${String(year).padStart(4, "0")}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

function normalizeDefenseTime(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = normalizeDigitsOnly(raw.trim());
  const match = /^(\d{1,2}):(\d{2})$/.exec(cleaned);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

interface DefenseSessionDbRow {
  id: string;
  thesis_id: string | null;
  thesis_title: string | null;
  student_name: string | null;
  date: string;
  time: string;
  location: string;
  referee_id: string | null;
  referee_name: string | null;
  status: string;
  created_at: string;
}

function formatDefenseSessionRow(row: DefenseSessionDbRow) {
  return {
    id: row.id,
    thesisId: row.thesis_id || null,
    thesisTitle: row.thesis_title || "پایان‌نامه حذف‌شده",
    studentName: (row.student_name || "").trim() || "تعیین نشده",
    date: row.date,
    time: row.time,
    location: row.location,
    refereeId: row.referee_id || null,
    refereeName: (row.referee_name || "").trim() || "تعیین نشده",
    status: row.status,
    createdAt: row.created_at,
  };
}

// GET /api/admin/defense-sessions
apiRouter.get("/admin/defense-sessions", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const rawStatus = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const normalizedStatus = rawStatus ? normalizeDefenseStatus(rawStatus) : null;

  const db = getDb();
  let rows = db
    .prepare(`
      SELECT
        ds.id,
        ds.thesis_id,
        t.title AS thesis_title,
        (COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) AS student_name,
        ds.date,
        ds.time,
        ds.location,
        ds.referee_id,
        (COALESCE(r.first_name, '') || ' ' || COALESCE(r.last_name, '')) AS referee_name,
        ds.status,
        ds.created_at
      FROM defense_sessions ds
      LEFT JOIN theses t ON t.id = ds.thesis_id
      LEFT JOIN students s ON s.id = t.student_id
      LEFT JOIN professors r ON r.id = ds.referee_id
      ORDER BY ds.date DESC, ds.time DESC, ds.created_at DESC
    `)
    .all() as unknown as DefenseSessionDbRow[];

  if (normalizedStatus) {
    rows = rows.filter((row) => row.status === normalizedStatus);
  }

  res.json({ sessions: rows.map(formatDefenseSessionRow) });
});

// POST /api/admin/defense-sessions
apiRouter.post("/admin/defense-sessions", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { thesisId, date, time, location, refereeId, status } = req.body || {};

  if (!thesisId || typeof thesisId !== "string" || !thesisId.trim()) {
    res.status(400).json({ message: "انتخاب پایان‌نامه الزامی است." });
    return;
  }

  const normalizedDate = normalizeDefenseDate(date);
  if (!normalizedDate) {
    res.status(400).json({ message: "فرمت تاریخ معتبر نیست (مثال: 1405/09/15 یا 2026-12-05)." });
    return;
  }

  const normalizedTime = normalizeDefenseTime(time);
  if (!normalizedTime) {
    res.status(400).json({ message: "فرمت ساعت معتبر نیست (مثال: 14:30)." });
    return;
  }

  if (!location || typeof location !== "string" || !location.trim()) {
    res.status(400).json({ message: "مکان جلسه دفاع الزامی است." });
    return;
  }
  const cleanLocation = location.trim();
  if (cleanLocation.length > 150) {
    res.status(400).json({ message: "مکان جلسه نباید بیشتر از ۱۵۰ کاراکتر باشد." });
    return;
  }

  let cleanStatus: (typeof ALLOWED_DEFENSE_STATUSES)[number] = "برنامه‌ریزی‌شده";
  if (status !== undefined && status !== null && String(status).trim() !== "") {
    const parsedStatus = normalizeDefenseStatus(status);
    if (!parsedStatus) {
      res.status(400).json({ message: "وضعیت جلسه دفاع معتبر نیست." });
      return;
    }
    cleanStatus = parsedStatus;
  }

  const db = getDb();
  const thesisRow = db
    .prepare("SELECT id FROM theses WHERE id = ?")
    .get(thesisId.trim()) as { id: string } | undefined;

  if (!thesisRow) {
    res.status(400).json({ message: "پایان‌نامه انتخاب‌شده یافت نشد." });
    return;
  }

  let cleanRefereeId: string | null = null;
  if (refereeId !== undefined && refereeId !== null && String(refereeId).trim() !== "") {
    if (typeof refereeId !== "string") {
      res.status(400).json({ message: "شناسه داور نامعتبر است." });
      return;
    }
    const profRow = db
      .prepare("SELECT id FROM professors WHERE id = ?")
      .get(refereeId.trim()) as { id: string } | undefined;
    if (!profRow) {
      res.status(400).json({ message: "داور انتخاب‌شده یافت نشد." });
      return;
    }
    cleanRefereeId = profRow.id;
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO defense_sessions (id, thesis_id, date, time, location, referee_id, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, thesisRow.id, normalizedDate, normalizedTime, cleanLocation, cleanRefereeId, cleanStatus, createdAt);

  const createdRow = db
    .prepare(`
      SELECT
        ds.id,
        ds.thesis_id,
        t.title AS thesis_title,
        (COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) AS student_name,
        ds.date,
        ds.time,
        ds.location,
        ds.referee_id,
        (COALESCE(r.first_name, '') || ' ' || COALESCE(r.last_name, '')) AS referee_name,
        ds.status,
        ds.created_at
      FROM defense_sessions ds
      LEFT JOIN theses t ON t.id = ds.thesis_id
      LEFT JOIN students s ON s.id = t.student_id
      LEFT JOIN professors r ON r.id = ds.referee_id
      WHERE ds.id = ?
    `)
    .get(id) as unknown as DefenseSessionDbRow;

  createAdminNotification(db, {
    type: "defense",
    title: "ثبت جلسه دفاع جدید",
    body: `جلسه دفاع برای تاریخ ${normalizedDate} ساعت ${normalizedTime} در ${cleanLocation} ثبت شد.`,
    targetModal: "defense_sessions",
    dedupeKey: `defense:created:${id}`,
    createdAt,
  });

  res.status(201).json({
    session: formatDefenseSessionRow(createdRow),
    message: "جلسه دفاع با موفقیت ثبت شد.",
  });
});

// PATCH /api/admin/defense-sessions/:id
apiRouter.patch("/admin/defense-sessions/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const sessionId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!sessionId) {
    res.status(400).json({ message: "شناسه جلسه دفاع نامعتبر است." });
    return;
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM defense_sessions WHERE id = ?")
    .get(sessionId) as {
      id: string;
      thesis_id: string | null;
      date: string;
      time: string;
      location: string;
      referee_id: string | null;
      status: string;
    } | undefined;

  if (!existing) {
    res.status(404).json({ message: "جلسه دفاع مورد نظر یافت نشد." });
    return;
  }

  const { status, date, time, location, refereeId } = req.body || {};

  let nextStatus = existing.status;
  if (status !== undefined) {
    const parsedStatus = normalizeDefenseStatus(status);
    if (!parsedStatus) {
      res.status(400).json({ message: "وضعیت جلسه دفاع معتبر نیست." });
      return;
    }
    nextStatus = parsedStatus;
  }

  let nextDate = existing.date;
  if (date !== undefined) {
    const parsedDate = normalizeDefenseDate(date);
    if (!parsedDate) {
      res.status(400).json({ message: "فرمت تاریخ معتبر نیست (مثال: 1405/09/15 یا 2026-12-05)." });
      return;
    }
    nextDate = parsedDate;
  }

  let nextTime = existing.time;
  if (time !== undefined) {
    const parsedTime = normalizeDefenseTime(time);
    if (!parsedTime) {
      res.status(400).json({ message: "فرمت ساعت معتبر نیست (مثال: 14:30)." });
      return;
    }
    nextTime = parsedTime;
  }

  let nextLocation = existing.location;
  if (location !== undefined) {
    if (typeof location !== "string" || !location.trim() || location.trim().length > 150) {
      res.status(400).json({ message: "مکان جلسه دفاع معتبر نیست." });
      return;
    }
    nextLocation = location.trim();
  }

  let nextRefereeId = existing.referee_id;
  if (refereeId !== undefined) {
    if (refereeId === null || String(refereeId).trim() === "") {
      nextRefereeId = null;
    } else if (typeof refereeId === "string") {
      const profRow = db
        .prepare("SELECT id FROM professors WHERE id = ?")
        .get(refereeId.trim()) as { id: string } | undefined;
      if (!profRow) {
        res.status(400).json({ message: "داور انتخاب‌شده یافت نشد." });
        return;
      }
      nextRefereeId = profRow.id;
    } else {
      res.status(400).json({ message: "شناسه داور نامعتبر است." });
      return;
    }
  }

  db.prepare(`
    UPDATE defense_sessions
    SET status = ?, date = ?, time = ?, location = ?, referee_id = ?
    WHERE id = ?
  `).run(nextStatus, nextDate, nextTime, nextLocation, nextRefereeId, sessionId);

  const updatedRow = db
    .prepare(`
      SELECT
        ds.id,
        ds.thesis_id,
        t.title AS thesis_title,
        (COALESCE(s.first_name, '') || ' ' || COALESCE(s.last_name, '')) AS student_name,
        ds.date,
        ds.time,
        ds.location,
        ds.referee_id,
        (COALESCE(r.first_name, '') || ' ' || COALESCE(r.last_name, '')) AS referee_name,
        ds.status,
        ds.created_at
      FROM defense_sessions ds
      LEFT JOIN theses t ON t.id = ds.thesis_id
      LEFT JOIN students s ON s.id = t.student_id
      LEFT JOIN professors r ON r.id = ds.referee_id
      WHERE ds.id = ?
    `)
    .get(sessionId) as unknown as DefenseSessionDbRow;

  res.json({
    session: formatDefenseSessionRow(updatedRow),
    message: "وضعیت جلسه دفاع با موفقیت به‌روزرسانی شد.",
  });
});

// DELETE /api/admin/defense-sessions/:id
apiRouter.delete("/admin/defense-sessions/:id", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const sessionId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!sessionId) {
    res.status(400).json({ message: "شناسه جلسه دفاع نامعتبر است." });
    return;
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM defense_sessions WHERE id = ?").run(sessionId);
  if (result.changes === 0) {
    res.status(404).json({ message: "جلسه دفاع مورد نظر یافت نشد." });
    return;
  }

  res.json({ message: "جلسه دفاع با موفقیت حذف شد." });
});

// --- ADMIN NOTIFICATIONS CENTER (Protected by requireAdmin) ---

type AdminNotificationType =
  | "pending"
  | "theses"
  | "professors"
  | "defense"
  | "registrations"
  | "system";

interface AdminNotificationDbRow {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  target_modal: string | null;
  dedupe_key: string | null;
  is_read: number;
  created_at: string;
}

function formatAdminNotificationRow(row: AdminNotificationDbRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    targetModal: row.target_modal || null,
    isRead: Number(row.is_read) === 1,
    createdAt: row.created_at,
  };
}

function createAdminNotification(
  db: ReturnType<typeof getDb>,
  params: {
    type: AdminNotificationType;
    title: string;
    body: string;
    targetModal: string | null;
    dedupeKey?: string | null;
    createdAt?: string;
  }
): void {
  const id = crypto.randomUUID();
  const createdAt = params.createdAt || new Date().toISOString();
  const dedupeKey = params.dedupeKey?.trim() || null;

  if (dedupeKey) {
    db.prepare(`
      INSERT OR IGNORE INTO admin_notifications (
        id, type, title, body, target_modal, dedupe_key, is_read, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, params.type, params.title, params.body, params.targetModal, dedupeKey, createdAt);
    return;
  }

  db.prepare(`
    INSERT INTO admin_notifications (
      id, type, title, body, target_modal, dedupe_key, is_read, created_at
    )
    VALUES (?, ?, ?, ?, ?, NULL, 0, ?)
  `).run(id, params.type, params.title, params.body, params.targetModal, createdAt);
}

function getTodayAndTomorrowDateStrings(): {
  todayJalali: string;
  tomorrowJalali: string;
  todayGregorian: string;
  tomorrowGregorian: string;
} {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const formatJalali = (d: Date): string => {
    try {
      const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(d);
      const y = normalizeDigitsOnly(parts.find((p) => p.type === "year")?.value || "");
      const m = normalizeDigitsOnly(parts.find((p) => p.type === "month")?.value || "");
      const day = normalizeDigitsOnly(parts.find((p) => p.type === "day")?.value || "");
      if (y && m && day) return `${y}/${m.padStart(2, "0")}/${day.padStart(2, "0")}`;
    } catch {
      // ignore fallback
    }
    return "";
  };

  const formatGregorian = (d: Date): string => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(d)
        .replace(/-/g, "/");
    } catch {
      return d.toISOString().slice(0, 10).replace(/-/g, "/");
    }
  };

  return {
    todayJalali: formatJalali(now),
    tomorrowJalali: formatJalali(tomorrow),
    todayGregorian: formatGregorian(now),
    tomorrowGregorian: formatGregorian(tomorrow),
  };
}

function syncConditionalAdminNotifications(db: ReturnType<typeof getDb>, adminUserId: string): void {
  // 1. Unread chat messages from non-admin users -> pending
  const chatSummary = db
    .prepare(`
      SELECT COUNT(*) AS cnt, MAX(id) AS last_id, MAX(created_at) AS last_at
      FROM chat_messages
      WHERE user_id != ?
    `)
    .get(adminUserId) as { cnt: number; last_id: number | null; last_at: string | null } | undefined;

  if (chatSummary && Number(chatSummary.cnt) > 0 && chatSummary.last_id) {
    createAdminNotification(db, {
      type: "pending",
      title: "پیام‌های خوانده‌نشده در گفتگو",
      body: `${chatSummary.cnt} پیام در بخش گفتگوی سامانه در انتظار بررسی است.`,
      targetModal: "chat",
      dedupeKey: `pending:chat:${chatSummary.last_id}`,
      createdAt: chatSummary.last_at || undefined,
    });
  }

  // 2. Theses without a supervisor -> theses
  const unsupervisedTheses = db
    .prepare(`
      SELECT id, title, created_at
      FROM theses
      WHERE supervisor_id IS NULL AND status != 'دفاع شده'
      ORDER BY created_at DESC
      LIMIT 15
    `)
    .all() as Array<{ id: string; title: string; created_at: string }>;

  for (const thesis of unsupervisedTheses) {
    createAdminNotification(db, {
      type: "theses",
      title: "پایان‌نامه بدون استاد راهنما",
      body: `پایان‌نامه «${thesis.title}» هنوز استاد راهنما ندارد.`,
      targetModal: "thesis_list",
      dedupeKey: `thesis:no_supervisor:${thesis.id}`,
      createdAt: thesis.created_at,
    });
  }

  // 3. Professors with full guidance capacity -> professors
  const fullProfessors = db
    .prepare(`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.capacity,
        COUNT(CASE WHEN t.id IS NOT NULL AND t.status != 'دفاع شده' THEN 1 END) AS active_count
      FROM professors p
      LEFT JOIN theses t ON t.supervisor_id = p.id
      WHERE p.capacity > 0
      GROUP BY p.id, p.first_name, p.last_name, p.capacity
      HAVING active_count >= p.capacity
    `)
    .all() as Array<{
      id: string;
      first_name: string;
      last_name: string;
      capacity: number;
      active_count: number;
    }>;

  for (const prof of fullProfessors) {
    createAdminNotification(db, {
      type: "professors",
      title: "تکمیل ظرفیت استاد راهنما",
      body: `ظرفیت راهنمایی ${prof.first_name} ${prof.last_name} تکمیل شده است (${prof.active_count} از ${prof.capacity}).`,
      targetModal: "professor_capacity",
      dedupeKey: `prof:full:${prof.id}:${prof.capacity}`,
    });
  }

  // 4. Defense sessions scheduled for today or tomorrow -> defense
  const { todayJalali, tomorrowJalali, todayGregorian, tomorrowGregorian } = getTodayAndTomorrowDateStrings();
  const scheduledSessions = db
    .prepare(`
      SELECT ds.id, ds.date, ds.time, ds.location, t.title AS thesis_title
      FROM defense_sessions ds
      LEFT JOIN theses t ON t.id = ds.thesis_id
      WHERE ds.status = 'برنامه‌ریزی‌شده'
    `)
    .all() as Array<{
      id: string;
      date: string;
      time: string;
      location: string;
      thesis_title: string | null;
    }>;

  for (const ds of scheduledSessions) {
    const normDate = normalizeDigitsOnly(ds.date).replace(/-/g, "/");
    let dayLabel = "";
    if (normDate === todayJalali || normDate === todayGregorian) {
      dayLabel = "امروز";
    } else if (normDate === tomorrowJalali || normDate === tomorrowGregorian) {
      dayLabel = "فردا";
    }
    if (dayLabel) {
      createAdminNotification(db, {
        type: "defense",
        title: `جلسه دفاع ${dayLabel}`,
        body: `${ds.thesis_title ? `«${ds.thesis_title}» - ` : ""}${ds.date} ساعت ${ds.time} (${ds.location})`,
        targetModal: "defense_sessions",
        dedupeKey: `defense:upcoming:${ds.id}:${normDate}`,
      });
    }
  }

  // 5. Recent registrations in the last 24 hours (backfill safely without duplicates) -> registrations
  const cutoff24hIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const recentStudents = db
    .prepare(`
      SELECT id, first_name, last_name, student_number, created_at
      FROM students
      WHERE created_at >= ?
      ORDER BY created_at DESC
      LIMIT 15
    `)
    .all(cutoff24hIso) as Array<{
      id: string;
      first_name: string;
      last_name: string;
      student_number: string;
      created_at: string;
    }>;
  for (const st of recentStudents) {
    createAdminNotification(db, {
      type: "registrations",
      title: "ثبت‌نام دانشجوی جدید",
      body: `${st.first_name} ${st.last_name} (شماره دانشجویی: ${st.student_number}) ثبت شد.`,
      targetModal: "student_search",
      dedupeKey: `reg:student:${st.id}`,
      createdAt: st.created_at,
    });
  }

  const recentProfessors = db
    .prepare(`
      SELECT id, first_name, last_name, academic_rank, created_at
      FROM professors
      WHERE created_at >= ?
      ORDER BY created_at DESC
      LIMIT 15
    `)
    .all(cutoff24hIso) as Array<{
      id: string;
      first_name: string;
      last_name: string;
      academic_rank: string;
      created_at: string;
    }>;
  for (const pr of recentProfessors) {
    createAdminNotification(db, {
      type: "registrations",
      title: "ثبت‌نام استاد جدید",
      body: `${pr.first_name} ${pr.last_name} (${pr.academic_rank}) به لیست اساتید اضافه شد.`,
      targetModal: "professor_list",
      dedupeKey: `reg:professor:${pr.id}`,
      createdAt: pr.created_at,
    });
  }

  const recentEmployees = db
    .prepare(`
      SELECT id, first_name, last_name, position, created_at
      FROM employees
      WHERE created_at >= ?
      ORDER BY created_at DESC
      LIMIT 15
    `)
    .all(cutoff24hIso) as Array<{
      id: string;
      first_name: string;
      last_name: string;
      position: string | null;
      created_at: string;
    }>;
  for (const emp of recentEmployees) {
    createAdminNotification(db, {
      type: "registrations",
      title: "ثبت‌نام کارمند جدید",
      body: `${emp.first_name} ${emp.last_name}${emp.position ? ` (${emp.position})` : ""} ثبت شد.`,
      targetModal: "employee_list",
      dedupeKey: `reg:employee:${emp.id}`,
      createdAt: emp.created_at,
    });
  }
}

// GET /api/admin/notifications
apiRouter.get("/admin/notifications", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const db = getDb();
    syncConditionalAdminNotifications(db, req.user?.id || "");

    const rows = db
      .prepare(`
        SELECT id, type, title, body, target_modal, dedupe_key, is_read, created_at
        FROM admin_notifications
        ORDER BY created_at DESC
        LIMIT 50
      `)
      .all() as unknown as AdminNotificationDbRow[];

    const unreadRow = db
      .prepare("SELECT COUNT(*) AS count FROM admin_notifications WHERE is_read = 0")
      .get() as { count: number } | undefined;

    res.json({
      notifications: rows.map(formatAdminNotificationRow),
      unreadCount: Number(unreadRow?.count ?? 0),
    });
  } catch (err: any) {
    console.error("[ADMIN NOTIFICATIONS ERROR]:", err);
    res.status(500).json({ message: "خطا در دریافت اعلان‌های مدیریت" });
  }
});

// PATCH /api/admin/notifications/read-all
apiRouter.patch("/admin/notifications/read-all", requireAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  try {
    const db = getDb();
    db.prepare("UPDATE admin_notifications SET is_read = 1 WHERE is_read = 0").run();
    res.json({
      message: "همه اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند.",
      unreadCount: 0,
    });
  } catch (err: any) {
    console.error("[ADMIN NOTIFICATIONS READ-ALL ERROR]:", err);
    res.status(500).json({ message: "خطا در علامت‌گذاری اعلان‌ها" });
  }
});

// PATCH /api/admin/notifications/:id/read
apiRouter.patch("/admin/notifications/:id/read", requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const notificationId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!notificationId) {
    res.status(400).json({ message: "شناسه اعلان نامعتبر است." });
    return;
  }

  try {
    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM admin_notifications WHERE id = ?")
      .get(notificationId) as { id: string } | undefined;

    if (!existing) {
      res.status(404).json({ message: "اعلان مورد نظر یافت نشد." });
      return;
    }

    db.prepare("UPDATE admin_notifications SET is_read = 1 WHERE id = ?").run(notificationId);

    const updated = db
      .prepare(`
        SELECT id, type, title, body, target_modal, dedupe_key, is_read, created_at
        FROM admin_notifications
        WHERE id = ?
      `)
      .get(notificationId) as unknown as AdminNotificationDbRow;

    const unreadRow = db
      .prepare("SELECT COUNT(*) AS count FROM admin_notifications WHERE is_read = 0")
      .get() as { count: number } | undefined;

    res.json({
      notification: formatAdminNotificationRow(updated),
      unreadCount: Number(unreadRow?.count ?? 0),
    });
  } catch (err: any) {
    console.error("[ADMIN NOTIFICATION READ ERROR]:", err);
    res.status(500).json({ message: "خطا در به‌روزرسانی وضعیت اعلان" });
  }
});


import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  student_id: string | null;
  role: string;
  profile: string;
  failed_attempts?: number;
  locked_until?: number;
  created_at: string;
}

export interface ChatMessageRow {
  id: number;
  user_id: string;
  sender: string;
  avatar: string | null;
  text: string;
  role: string;
  created_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  expires_at: number;
  created_at: string;
}

export function getDataDir(): string {
  const dir = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err: any) {
      console.error(`[CRITICAL DATABASE ERROR] Failed to create data directory at "${dir}": ${err?.message || err}`);
      throw err;
    }
  }
  return dir;
}

export function getDbPath(): string {
  if (process.env.DATABASE_PATH && process.env.DATABASE_PATH.trim()) {
    const custom = path.resolve(process.env.DATABASE_PATH.trim());
    const parentDir = path.dirname(custom);
    if (!fs.existsSync(parentDir)) {
      try {
        fs.mkdirSync(parentDir, { recursive: true });
      } catch (err: any) {
        console.error(`[CRITICAL DATABASE ERROR] Failed to create database directory at "${parentDir}": ${err?.message || err}`);
        throw err;
      }
    }
    return custom;
  }
  const dataDir = getDataDir();
  return path.join(dataDir, "app.db");
}

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);

  // Check database directory write permissions
  try {
    fs.accessSync(dbDir, fs.constants.W_OK);
  } catch (fsErr: any) {
    console.error(
      `[CRITICAL DATABASE ERROR] Database directory "${dbDir}" is not writable. Please check filesystem permissions and disk space: ${fsErr?.message || fsErr}`
    );
  }

  let db: DatabaseSync;
  try {
    db = new DatabaseSync(dbPath);

    // Enable WAL mode and foreign keys
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");

    // Perform a lightweight write test to verify that the database is truly writable
    db.exec("CREATE TABLE IF NOT EXISTS _db_write_test (id INTEGER PRIMARY KEY); DROP TABLE IF EXISTS _db_write_test;");
  } catch (err: any) {
    console.error(
      `[CRITICAL DATABASE ERROR] SQLite database file at "${dbPath}" is not writable or inaccessible. The server will not be able to persist data. Reason: ${err?.message || err}`
    );
    throw new Error(`Database at "${dbPath}" is not writable: ${err?.message || err}`);
  }

  // Create tables
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        student_id TEXT,
        role TEXT NOT NULL DEFAULT 'student',
        profile TEXT NOT NULL DEFAULT '{}',
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id),
        sender TEXT NOT NULL,
        avatar TEXT,
        text TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `);

    // Safe column migrations for existing databases
    try {
      db.exec("ALTER TABLE users ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0;");
    } catch {
      // Column already exists
    }
    try {
      db.exec("ALTER TABLE users ADD COLUMN locked_until INTEGER NOT NULL DEFAULT 0;");
    } catch {
      // Column already exists
    }
  } catch (schemaErr: any) {
    console.error(
      `[CRITICAL DATABASE ERROR] Failed to create or verify schema tables in "${dbPath}": ${schemaErr?.message || schemaErr}`
    );
    throw schemaErr;
  }

  dbInstance = db;
  return db;
}

export const MAX_BACKUP_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
export const MAX_BACKUP_USERS = 5000; // Max 5,000 user records per backup
export const MAX_BACKUP_MESSAGES = 20000; // Max 20,000 chat message records per backup

export interface ValidatedUserBackup {
  id: string;
  email: string;
  name: string;
  student_id: string | null;
  role: "admin" | "student";
  profile: string;
  created_at: string;
}

export interface ValidatedMessageBackup {
  id: number | null;
  user_id: string;
  sender: string;
  avatar: string | null;
  text: string;
  role: string;
  created_at: string;
}

export interface PreRestoreBackupInfo {
  filePath: string;
  fileName: string;
  counts: { users: number; messages: number };
  timestamp: string;
}

export interface OnlineBackupResult {
  backupPath: string;
  fileSizeBytes: number;
  timestamp: string;
}

/**
 * Creates an atomic online backup of the live SQLite database file.
 * Because WAL mode is active (PRAGMA journal_mode = WAL), direct filesystem copies of app.db
 * can miss uncheckpointed WAL frames or capture torn pages.
 * SQLite's native "VACUUM INTO 'target.db'" executes an online, transactional point-in-time
 * snapshot that flushes and combines all WAL updates into a clean standalone database file,
 * without blocking active database readers or writers.
 */
export function createOnlineDatabaseBackup(customTargetPath?: string): OnlineBackupResult {
  const db = getDb();
  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch (err: any) {
      console.error(`[BACKUP DIR ERROR] Failed to create backups dir: ${err?.message || err}`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const targetPath = customTargetPath
    ? path.resolve(customTargetPath)
    : path.join(backupDir, `backup-${timestamp}.db`);

  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // SQLite's VACUUM INTO requires that the destination file does not exist beforehand
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }

  const escapedPath = targetPath.replace(/'/g, "''");
  try {
    db.exec(`VACUUM INTO '${escapedPath}';`);
  } catch (err: any) {
    console.error(`[ONLINE BACKUP ERROR] SQLite online backup (VACUUM INTO) failed: ${err?.message || err}`);
    throw err;
  }

  const stats = fs.statSync(targetPath);
  return {
    backupPath: targetPath,
    fileSizeBytes: stats.size,
    timestamp: new Date().toISOString(),
  };
}

export function exportDatabaseBackup(): {
  exportedAt: string;
  version: number;
  database: string;
  counts: { users: number; messages: number };
  users: Omit<UserRow, "password_hash">[];
  messages: ChatMessageRow[];
} {
  const db = getDb();
  // Strictly omit password_hash for security
  const users = db
    .prepare("SELECT id, email, name, student_id, role, profile, created_at FROM users ORDER BY created_at ASC")
    .all() as unknown as Omit<UserRow, "password_hash">[];

  const messages = db
    .prepare("SELECT id, user_id, sender, avatar, text, role, created_at FROM chat_messages ORDER BY id ASC")
    .all() as unknown as ChatMessageRow[];

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    database: "sqlite",
    counts: {
      users: users.length,
      messages: messages.length,
    },
    users,
    messages,
  };
}

/**
 * Creates an automatic snapshot backup of current database state before any restore operation.
 * Stored in the backups/ directory with a pre-restore timestamp prefix.
 */
export function createPreRestoreBackup(): PreRestoreBackupInfo {
  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
    } catch (err: any) {
      console.error(`[PRE-RESTORE BACKUP WARNING] Failed to create backups directory: ${err?.message || err}`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `pre-restore-${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  const backupData = exportDatabaseBackup();
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf-8");

  console.log(`[AUTO PRE-RESTORE BACKUP] Snapshot created at "${filePath}" (${backupData.counts.users} users, ${backupData.counts.messages} messages)`);

  return {
    filePath,
    fileName,
    counts: backupData.counts,
    timestamp: backupData.exportedAt,
  };
}

/**
 * Strict schema and bounds validation for incoming backup data.
 */
export function validateBackupData(backup: any): {
  validatedUsers: ValidatedUserBackup[];
  validatedMessages: ValidatedMessageBackup[];
} {
  if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
    throw new Error("Invalid backup data: payload must be a JSON object.");
  }

  const hasUsers = Array.isArray(backup.users);
  const hasMessages = Array.isArray(backup.messages);

  if (!hasUsers && !hasMessages) {
    throw new Error(
      "Invalid backup format: backup must contain at least one of 'users' or 'messages' array."
    );
  }

  const validatedUsers: ValidatedUserBackup[] = [];
  const validatedMessages: ValidatedMessageBackup[] = [];

  // 1. Validate Users array
  if (hasUsers) {
    if (backup.users.length > MAX_BACKUP_USERS) {
      throw new Error(
        `User records limit exceeded: backup contains ${backup.users.length} users, but the maximum allowed limit is ${MAX_BACKUP_USERS}.`
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seenEmails = new Set<string>();

    for (let i = 0; i < backup.users.length; i++) {
      const u = backup.users[i];
      if (!u || typeof u !== "object" || Array.isArray(u)) {
        throw new Error(`Invalid user record at index ${i}: record must be an object.`);
      }

      // Email validation
      if (!u.email || typeof u.email !== "string" || !emailRegex.test(u.email.trim()) || u.email.trim().length > 255) {
        throw new Error(`Invalid email address in user record #${i + 1}.`);
      }
      const email = u.email.trim().toLowerCase();
      if (seenEmails.has(email)) {
        throw new Error(`Duplicate email address "${email}" found in backup users array at record #${i + 1}.`);
      }
      seenEmails.add(email);

      // Name validation
      if (!u.name || typeof u.name !== "string" || !u.name.trim() || u.name.trim().length > 100) {
        throw new Error(`Invalid name in user record #${i + 1} (must be between 1 and 100 characters).`);
      }
      const name = u.name.trim();

      // ID validation (safe UUID or alphanumeric)
      let id = crypto.randomUUID();
      if (u.id !== undefined && u.id !== null) {
        if (typeof u.id !== "string" || !/^[a-zA-Z0-9_\-:]{1,64}$/.test(u.id.trim())) {
          throw new Error(`Invalid ID format in user record #${i + 1}. Must be alphanumeric up to 64 chars.`);
        }
        id = u.id.trim();
      }

      // Student ID validation
      let studentId: string | null = null;
      const rawStudentId = u.student_id ?? u.studentId;
      if (rawStudentId !== undefined && rawStudentId !== null) {
        if (typeof rawStudentId !== "string" || rawStudentId.trim().length > 50) {
          throw new Error(`Invalid studentId in user record #${i + 1} (max 50 characters).`);
        }
        studentId = rawStudentId.trim();
      }

      // Role validation (prevent privilege elevation)
      const role: "admin" | "student" = u.role === "admin" ? "admin" : "student";

      // Profile validation & prototype pollution protection
      let profileStr = "{}";
      if (u.profile !== undefined && u.profile !== null) {
        if (typeof u.profile === "object") {
          const serialized = JSON.stringify(u.profile);
          if (serialized.length > 50000) {
            throw new Error(`User profile data in record #${i + 1} exceeds 50KB size limit.`);
          }
          if (serialized.includes("__proto__") || serialized.includes("constructor") && serialized.includes("prototype")) {
            throw new Error(`Potential prototype pollution detected in user record #${i + 1} profile.`);
          }
          profileStr = serialized;
        } else if (typeof u.profile === "string") {
          if (u.profile.length > 50000) {
            throw new Error(`User profile string in record #${i + 1} exceeds 50KB size limit.`);
          }
          profileStr = u.profile;
        }
      }

      // Created at date
      let createdAt = new Date().toISOString();
      const rawCreatedAt = u.created_at ?? u.createdAt;
      if (typeof rawCreatedAt === "string" && !isNaN(Date.parse(rawCreatedAt))) {
        createdAt = new Date(rawCreatedAt).toISOString();
      }

      validatedUsers.push({
        id,
        email,
        name,
        student_id: studentId,
        role,
        profile: profileStr,
        created_at: createdAt,
      });
    }
  }

  // 2. Validate Messages array
  if (hasMessages) {
    if (backup.messages.length > MAX_BACKUP_MESSAGES) {
      throw new Error(
        `Message records limit exceeded: backup contains ${backup.messages.length} messages, but maximum allowed limit is ${MAX_BACKUP_MESSAGES}.`
      );
    }

    for (let i = 0; i < backup.messages.length; i++) {
      const m = backup.messages[i];
      if (!m || typeof m !== "object" || Array.isArray(m)) {
        throw new Error(`Invalid message record at index ${i}: record must be an object.`);
      }

      const userId = m.user_id ?? m.userId;
      if (!userId || typeof userId !== "string" || userId.trim().length > 64) {
        throw new Error(`Invalid user_id in chat message record #${i + 1}.`);
      }

      if (!m.text || typeof m.text !== "string" || !m.text.trim() || m.text.length > 1000) {
        throw new Error(`Invalid text in chat message record #${i + 1} (must be between 1 and 1000 characters).`);
      }

      let id: number | null = null;
      if (m.id !== undefined && m.id !== null) {
        const numId = Number(m.id);
        if (!isNaN(numId) && Number.isInteger(numId) && numId > 0) {
          id = numId;
        }
      }

      let sender = "کاربر";
      if (typeof m.sender === "string" && m.sender.trim()) {
        sender = m.sender.trim().slice(0, 100);
      }

      let avatar: string | null = null;
      if (typeof m.avatar === "string" && m.avatar.trim()) {
        if (m.avatar.length > 300000) {
          throw new Error(`Avatar in message #${i + 1} exceeds size limit of 300KB.`);
        }
        avatar = m.avatar.trim();
      }

      let role = "student";
      if (typeof m.role === "string" && m.role.trim()) {
        role = m.role.trim().slice(0, 20);
      }

      let createdAt = new Date().toISOString();
      const rawCreatedAt = m.created_at ?? m.createdAt;
      if (typeof rawCreatedAt === "string" && !isNaN(Date.parse(rawCreatedAt))) {
        createdAt = new Date(rawCreatedAt).toISOString();
      }

      validatedMessages.push({
        id,
        user_id: userId.trim(),
        sender,
        avatar,
        text: m.text.trim(),
        role,
        created_at: createdAt,
      });
    }
  }

  return { validatedUsers, validatedMessages };
}

export async function restoreDatabaseBackup(
  backup: { users?: any[]; messages?: any[] },
  defaultPasswordHashFn?: (password: string) => Promise<string>,
  options?: { skipPreBackup?: boolean }
): Promise<{
  restoredUsers: number;
  restoredMessages: number;
  preRestoreBackup?: PreRestoreBackupInfo;
}> {
  // Step 1: Strict schema and limits validation
  const { validatedUsers, validatedMessages } = validateBackupData(backup);

  // Step 2: Automatic pre-restore backup snapshot
  let preRestoreBackup: PreRestoreBackupInfo | undefined;
  if (!options?.skipPreBackup) {
    preRestoreBackup = createPreRestoreBackup();
  }

  const db = getDb();
  let restoredUsers = 0;
  let restoredMessages = 0;

  // Step 3: Pre-compute placeholder hashes for any users that don't already exist
  // Doing this before opening the transaction keeps the transaction fast and synchronous
  const checkStmt = db.prepare("SELECT id, password_hash FROM users WHERE id = ? OR email = ? COLLATE NOCASE");
  const userActions: Array<{
    isUpdate: boolean;
    existingId?: string;
    user: ValidatedUserBackup;
    placeholderHash?: string;
  }> = [];

  for (const u of validatedUsers) {
    const existing = checkStmt.get(u.id, u.email) as unknown as { id: string; password_hash: string } | undefined;
    if (existing) {
      userActions.push({ isUpdate: true, existingId: existing.id, user: u });
    } else {
      const placeholderHash = defaultPasswordHashFn
        ? await defaultPasswordHashFn(crypto.randomUUID() + "!RESTORED_ACCOUNT_NEEDS_PASSWORD_RESET")
        : "RESTORED_ACCOUNT_NEEDS_PASSWORD_RESET";
      userActions.push({ isUpdate: false, user: u, placeholderHash });
    }
  }

  // Step 4: Execute database writes within an atomic transaction
  db.exec("BEGIN IMMEDIATE;");
  try {
    const insertUserStmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, student_id, role, profile, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateUserStmt = db.prepare(`
      UPDATE users SET name = ?, student_id = ?, role = ?, profile = ? WHERE id = ?
    `);

    for (const action of userActions) {
      if (action.isUpdate) {
        updateUserStmt.run(
          action.user.name,
          action.user.student_id,
          action.user.role,
          action.user.profile,
          action.existingId
        );
        restoredUsers++;
      } else {
        insertUserStmt.run(
          action.user.id,
          action.user.email,
          action.placeholderHash!,
          action.user.name,
          action.user.student_id,
          action.user.role,
          action.user.profile,
          action.user.created_at
        );
        restoredUsers++;
      }
    }

    if (validatedMessages.length > 0) {
      const insertMsgStmt = db.prepare(`
        INSERT OR IGNORE INTO chat_messages (id, user_id, sender, avatar, text, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const m of validatedMessages) {
        insertMsgStmt.run(
          m.id,
          m.user_id,
          m.sender,
          m.avatar,
          m.text,
          m.role,
          m.created_at
        );
        restoredMessages++;
      }
    }

    db.exec("COMMIT;");
  } catch (err: any) {
    try {
      db.exec("ROLLBACK;");
    } catch (rbErr) {
      console.error("[RESTORE TRANSACTION ROLLBACK ERROR]:", rbErr);
    }
    console.error("[CRITICAL RESTORE TRANSACTION FAILED]:", err?.message || err);
    throw err;
  }

  return { restoredUsers, restoredMessages, preRestoreBackup };
}

export async function initAdminUser(hashPasswordFn: (password: string) => Promise<string>): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  try {
    const db = getDb();

    // 1. Check if an admin user already exists in the database
    const existingAdmin = db.prepare("SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1").get() as unknown as { id: string; email: string; role: string } | undefined;

    if (existingAdmin) {
      console.log(`[ADMIN INIT] Existing admin user retained without modifications: ${existingAdmin.email}`);
      return;
    }

    // 2. If no user with role='admin' exists, check if user with ADMIN_EMAIL exists to ensure role='admin'
    if (adminEmail) {
      const normalizedAdminEmail = adminEmail.toLowerCase();
      const existingUserByEmail = db.prepare("SELECT id, email, role FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))").get(normalizedAdminEmail) as unknown as { id: string; email: string; role: string } | undefined;

      if (existingUserByEmail) {
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existingUserByEmail.id);
        console.log(`[ADMIN INIT] Confirmed role admin for user: ${existingUserByEmail.email}`);
        return;
      }

      // 3. Only if NO admin account exists at all, create one from ADMIN_EMAIL & ADMIN_PASSWORD
      if (adminPassword) {
        const passwordHash = await hashPasswordFn(adminPassword);
        const name = process.env.ADMIN_NAME?.trim() || "مدیر سیستم";
        const now = new Date().toISOString();
        const id = crypto.randomUUID();

        const insertStmt = db.prepare(`
          INSERT INTO users (id, email, password_hash, name, student_id, role, profile, created_at)
          VALUES (?, ?, ?, ?, ?, 'admin', '{}', ?)
        `);
        insertStmt.run(id, normalizedAdminEmail, passwordHash, name, "ADMIN", now);
        console.log(`[ADMIN INIT] Initialized new admin account: ${normalizedAdminEmail}`);
      }
    }
  } catch (err: any) {
    console.error(`[CRITICAL DATABASE ERROR] Failed to initialize admin account in database: ${err?.message || err}`, err);
    throw err;
  }
}

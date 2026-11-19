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

      CREATE TABLE IF NOT EXISTS edu_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        head TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS edu_fields (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL COLLATE NOCASE,
        level TEXT NOT NULL DEFAULT 'کارشناسی',
        created_at TEXT NOT NULL,
        UNIQUE(name, level)
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        national_id TEXT NOT NULL UNIQUE,
        personnel_code TEXT,
        phone TEXT,
        position TEXT,
        group_id TEXT REFERENCES edu_groups(id) ON DELETE SET NULL,
        field_id TEXT REFERENCES edu_fields(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS professor_specialties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS professors (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        national_id TEXT NOT NULL UNIQUE,
        personnel_code TEXT,
        phone TEXT,
        email TEXT,
        academic_rank TEXT NOT NULL,
        group_id TEXT REFERENCES edu_groups(id) ON DELETE SET NULL,
        field_id TEXT REFERENCES edu_fields(id) ON DELETE SET NULL,
        specialty_id TEXT REFERENCES professor_specialties(id) ON DELETE SET NULL,
        capacity INTEGER NOT NULL DEFAULT 0,
        access_level TEXT NOT NULL DEFAULT 'view',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        national_id TEXT NOT NULL UNIQUE,
        student_number TEXT NOT NULL UNIQUE,
        phone TEXT,
        field_id TEXT REFERENCES edu_fields(id) ON DELETE SET NULL,
        group_id TEXT REFERENCES edu_groups(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_employees_group_id ON employees(group_id);
      CREATE INDEX IF NOT EXISTS idx_professors_group_id ON professors(group_id);
      CREATE INDEX IF NOT EXISTS idx_professors_field_id ON professors(field_id);
      CREATE INDEX IF NOT EXISTS idx_students_national_id ON students(national_id);
      CREATE INDEX IF NOT EXISTS idx_students_student_number ON students(student_number);
      CREATE INDEX IF NOT EXISTS idx_students_field_id ON students(field_id);
      CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id);
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

    // Check employees columns via PRAGMA table_info(employees) and add field_id if missing
    const employeeColumns = db
      .prepare("PRAGMA table_info(employees)")
      .all() as Array<{ name: string }>;
    if (!employeeColumns.some((col) => col.name === "field_id")) {
      db.exec("ALTER TABLE employees ADD COLUMN field_id TEXT REFERENCES edu_fields(id) ON DELETE SET NULL;");
    }
    db.exec("CREATE INDEX IF NOT EXISTS idx_employees_field_id ON employees(field_id);");

    // Ensure students columns exist if table already existed with partial columns
    const studentColumns = db
      .prepare("PRAGMA table_info(students)")
      .all() as Array<{ name: string }>;
    const existingStudentColNames = new Set(studentColumns.map((col) => col.name));
    if (!existingStudentColNames.has("phone")) {
      db.exec("ALTER TABLE students ADD COLUMN phone TEXT;");
    }
    if (!existingStudentColNames.has("field_id")) {
      db.exec("ALTER TABLE students ADD COLUMN field_id TEXT REFERENCES edu_fields(id) ON DELETE SET NULL;");
    }
    if (!existingStudentColNames.has("group_id")) {
      db.exec("ALTER TABLE students ADD COLUMN group_id TEXT REFERENCES edu_groups(id) ON DELETE SET NULL;");
    }

    // Safe migration for edu_fields: add level column if missing, enforce UNIQUE(name, level), and seed default fields
    const eduFieldColumns = db
      .prepare("PRAGMA table_info(edu_fields)")
      .all() as Array<{ name: string }>;
    if (!eduFieldColumns.some((col) => col.name === "level")) {
      db.exec("ALTER TABLE edu_fields ADD COLUMN level TEXT NOT NULL DEFAULT 'کارشناسی';");
    }

    const eduFieldsTableRow = db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'edu_fields'")
      .get() as { sql?: string } | undefined;
    const eduFieldsSql = (eduFieldsTableRow?.sql || "").replace(/\s+/g, " ").toLowerCase();
    const hasCompositeUnique =
      eduFieldsSql.includes("unique(name, level)") || eduFieldsSql.includes("unique (name, level)");

    if (!hasCompositeUnique) {
      db.exec("PRAGMA foreign_keys = OFF;");
      try {
        db.exec("BEGIN IMMEDIATE;");
        db.exec(`
          CREATE TABLE edu_fields_migrated (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL COLLATE NOCASE,
            level TEXT NOT NULL DEFAULT 'کارشناسی',
            created_at TEXT NOT NULL,
            UNIQUE(name, level)
          );
          INSERT INTO edu_fields_migrated (id, name, level, created_at)
          SELECT id, name, COALESCE(NULLIF(TRIM(level), ''), 'کارشناسی'), created_at FROM edu_fields;
          DROP TABLE edu_fields;
          ALTER TABLE edu_fields_migrated RENAME TO edu_fields;
        `);
        db.exec("COMMIT;");
      } catch (migrateErr) {
        try {
          db.exec("ROLLBACK;");
        } catch {
          // ignore
        }
        throw migrateErr;
      } finally {
        db.exec("PRAGMA foreign_keys = ON;");
      }
    }

    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_edu_fields_name_level ON edu_fields(name COLLATE NOCASE, level);");

    const seededEduFields: Array<{ name: string; level: string }> = [
      // کارشناسی
      { name: "مهندسی کامپیوتر", level: "کارشناسی" },
      { name: "مهندسی برق", level: "کارشناسی" },
      { name: "مهندسی عمران", level: "کارشناسی" },
      { name: "مهندسی صنایع", level: "کارشناسی" },
      { name: "مهندسی معماری", level: "کارشناسی" },
      { name: "معماری داخلی", level: "کارشناسی" },
      { name: "حسابداری", level: "کارشناسی" },
      { name: "حقوق", level: "کارشناسی" },
      { name: "روان‌شناسی", level: "کارشناسی" },
      { name: "مدیریت بازرگانی", level: "کارشناسی" },
      { name: "ارتباط تصویری", level: "کارشناسی" },
      { name: "طراحی لباس", level: "کارشناسی" },
      { name: "باستان‌شناسی", level: "کارشناسی" },
      { name: "علوم ورزشی", level: "کارشناسی" },
      // کارشناسی ارشد
      { name: "مهندسی فناوری اطلاعات", level: "کارشناسی ارشد" },
      { name: "ارتباط تصویری", level: "کارشناسی ارشد" },
      { name: "مهندسی معماری", level: "کارشناسی ارشد" },
      { name: "معماری داخلی", level: "کارشناسی ارشد" },
      { name: "پژوهش هنر", level: "کارشناسی ارشد" },
      { name: "هنر اسلامی", level: "کارشناسی ارشد" },
      { name: "طراحی پارچه و لباس", level: "کارشناسی ارشد" },
      { name: "تاریخ هنر ایران باستان", level: "کارشناسی ارشد" },
      { name: "تصویرسازی", level: "کارشناسی ارشد" },
      { name: "باستان‌شناسی", level: "کارشناسی ارشد" },
      { name: "ارتباطات اجتماعی", level: "کارشناسی ارشد" },
      { name: "حقوق خصوصی", level: "کارشناسی ارشد" },
    ];

    const insertSeedFieldStmt = db.prepare(`
      INSERT OR IGNORE INTO edu_fields (id, name, level, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const seedTimestamp = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE;");
    try {
      for (const item of seededEduFields) {
        insertSeedFieldStmt.run(crypto.randomUUID(), item.name, item.level, seedTimestamp);
      }
      db.exec("COMMIT;");
    } catch (seedErr) {
      try {
        db.exec("ROLLBACK;");
      } catch {
        // ignore
      }
      throw seedErr;
    }

    // Safe migration for professors.specialty_id (preserve existing field_id)
    const professorColumns = db
      .prepare("PRAGMA table_info(professors)")
      .all() as Array<{ name: string }>;
    if (!professorColumns.some((col) => col.name === "specialty_id")) {
      db.exec("ALTER TABLE professors ADD COLUMN specialty_id TEXT REFERENCES professor_specialties(id) ON DELETE SET NULL;");
    }
    db.exec("CREATE INDEX IF NOT EXISTS idx_professors_specialty_id ON professors(specialty_id);");

    // Seed edu_groups only if currently empty
    const eduGroupCountRow = db
      .prepare("SELECT COUNT(*) AS cnt FROM edu_groups")
      .get() as { cnt: number };
    if (eduGroupCountRow.cnt === 0) {
      const seededEduGroups = [
        "گروه مهندسی کامپیوتر و فناوری اطلاعات",
        "گروه مهندسی برق",
        "گروه مهندسی عمران",
        "گروه مهندسی صنایع",
        "گروه معماری و شهرسازی",
        "گروه هنر",
        "گروه علوم انسانی و مدیریت",
        "گروه حقوق",
        "گروه علوم ورزشی",
      ];
      const insertSeedGroupStmt = db.prepare(`
        INSERT OR IGNORE INTO edu_groups (id, name, head, created_at)
        VALUES (?, ?, NULL, ?)
      `);
      db.exec("BEGIN IMMEDIATE;");
      try {
        for (const groupName of seededEduGroups) {
          insertSeedGroupStmt.run(crypto.randomUUID(), groupName, seedTimestamp);
        }
        db.exec("COMMIT;");
      } catch (grpSeedErr) {
        try {
          db.exec("ROLLBACK;");
        } catch {
          // ignore
        }
        throw grpSeedErr;
      }
    }

    // Seed professor_specialties with INSERT OR IGNORE
    const seededProfessorSpecialties = [
      "هوش مصنوعی",
      "شبکه‌های کامپیوتری",
      "مهندسی نرم‌افزار",
      "پردازش تصویر",
      "سازه",
      "مدیریت ساخت",
      "ژئوتکنیک",
      "سیستم‌های قدرت",
      "الکترونیک",
      "معماری داخلی",
      "ارتباط تصویری",
      "هنر اسلامی",
      "باستان‌شناسی",
      "حقوق خصوصی",
      "حقوق جزا و جرم‌شناسی",
      "روان‌شناسی بالینی",
      "حسابداری مالی",
      "مدیریت بازرگانی",
      "فیزیولوژی ورزشی",
    ];
    const insertSeedSpecialtyStmt = db.prepare(`
      INSERT OR IGNORE INTO professor_specialties (id, name, created_at)
      VALUES (?, ?, ?)
    `);
    db.exec("BEGIN IMMEDIATE;");
    try {
      for (const specName of seededProfessorSpecialties) {
        insertSeedSpecialtyStmt.run(crypto.randomUUID(), specName, seedTimestamp);
      }
      db.exec("COMMIT;");
    } catch (specSeedErr) {
      try {
        db.exec("ROLLBACK;");
      } catch {
        // ignore
      }
      throw specSeedErr;
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
    const existingAdmin = db
      .prepare("SELECT id, role FROM users WHERE role = 'admin' LIMIT 1")
      .get() as unknown as { id: string; role: string } | undefined;

    if (existingAdmin) {
      console.log("[ADMIN INIT] Existing admin user retained without modifications.");
      return;
    }

    const totalUsersRow = db.prepare("SELECT COUNT(*) as count FROM users").get() as unknown as { count: number };
    const isDbEmpty = (totalUsersRow?.count || 0) === 0;

    if (!adminEmail) {
      if (isDbEmpty) {
        console.warn("[ADMIN INIT] Database has no users and ADMIN_EMAIL is not configured.");
      }
      return;
    }

    const normalizedAdminEmail = adminEmail.toLowerCase();

    // 2. If user with ADMIN_EMAIL already exists (e.g. non-admin), confirm role='admin' without overwriting password
    const existingUserByEmail = db
      .prepare("SELECT id, role FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))")
      .get(normalizedAdminEmail) as unknown as { id: string; role: string } | undefined;

    if (existingUserByEmail) {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existingUserByEmail.id);
      console.log("[ADMIN INIT] Confirmed admin role for existing account.");
      return;
    }

    // 3. If database is empty (or no admin exists), create initial admin with scrypt-hashed password (never log password/hash)
    if (isDbEmpty || adminEmail) {
      if (!adminPassword) {
        console.warn("[ADMIN INIT] ADMIN_PASSWORD is not configured; cannot initialize admin account.");
        return;
      }

      const passwordHash = await hashPasswordFn(adminPassword);
      const name = process.env.ADMIN_NAME?.trim() || "مدیر سیستم";
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const insertStmt = db.prepare(`
        INSERT INTO users (id, email, password_hash, name, student_id, role, profile, created_at)
        VALUES (?, ?, ?, ?, ?, 'admin', '{}', ?)
      `);
      insertStmt.run(id, normalizedAdminEmail, passwordHash, name, "ADMIN", now);
      console.log("[ADMIN INIT] Initialized new admin account.");
    }
  } catch (err: any) {
    console.error(`[CRITICAL DATABASE ERROR] Failed to initialize admin account in database: ${err?.message || err}`);
    throw err;
  }
}

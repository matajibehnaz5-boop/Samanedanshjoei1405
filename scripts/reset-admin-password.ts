import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getDb, getDataDir } from "../server/db.js";
import { hashPassword } from "../server/auth.js";

export async function resetAdminPassword(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    console.error("Error: Both ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be configured.");
    process.exit(1);
  }

  const normalizedEmail = adminEmail.toLowerCase();
  const db = getDb();

  // Find user by email (case-insensitive)
  const existing = db
    .prepare("SELECT id, email, role, profile FROM users WHERE email = ? COLLATE NOCASE")
    .get(normalizedEmail) as unknown as { id: string; email: string; role: string; profile: string } | undefined;

  const passwordHash = await hashPassword(adminPassword);
  const now = new Date().toISOString();

  // Inspect columns in users table to clear any database-level lockouts
  const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((c) => c.name));

  if (existing) {
    const updates: string[] = ["password_hash = ?", "role = 'admin'"];
    const params: any[] = [passwordHash];

    const adminName = process.env.ADMIN_NAME?.trim();
    if (adminName) {
      updates.push("name = ?");
      params.push(adminName);
    }

    if (columnNames.has("failed_attempts")) {
      updates.push("failed_attempts = 0");
    }
    if (columnNames.has("locked_until")) {
      updates.push("locked_until = 0");
    }
    if (columnNames.has("is_locked")) {
      updates.push("is_locked = 0");
    }

    // Clean profile JSON if it contains any lockout flags
    let cleanedProfile = existing.profile;
    try {
      const parsed = JSON.parse(existing.profile || "{}");
      let changed = false;
      for (const k of ["failedAttempts", "lockedUntil", "isLocked", "lockout"]) {
        if (k in parsed) {
          delete parsed[k];
          changed = true;
        }
      }
      if (changed) {
        cleanedProfile = JSON.stringify(parsed);
        updates.push("profile = ?");
        params.push(cleanedProfile);
      }
    } catch {
      // ignore JSON parse issues
    }

    params.push(existing.id);

    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    // Delete any active sessions for this user so re-login is required with new credentials
    try {
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);
    } catch {
      // ignore
    }

    console.log(`Admin password reset successfully and lockout cleared for: ${normalizedEmail}`);
  } else {
    // If user does not exist yet, create account with role=admin and hashed password
    const name = process.env.ADMIN_NAME?.trim() || "مدیر سیستم";
    const id = crypto.randomUUID();

    const insertCols = ["id", "email", "password_hash", "name", "student_id", "role", "profile", "created_at"];
    const insertVals: Array<string | number> = [id, normalizedEmail, passwordHash, name, "ADMIN", "admin", "{}", now];

    if (columnNames.has("failed_attempts")) {
      insertCols.push("failed_attempts");
      insertVals.push(0);
    }
    if (columnNames.has("locked_until")) {
      insertCols.push("locked_until");
      insertVals.push(0);
    }

    const placeholders = insertCols.map(() => "?").join(", ");
    db.prepare(`INSERT INTO users (${insertCols.join(", ")}) VALUES (${placeholders})`).run(...insertVals);

    console.log(`Created admin account with role admin and set password for: ${normalizedEmail}`);
  }

  // Signal running server processes to clear any in-memory rate limiting lockouts
  try {
    const dataDir = getDataDir();
    const lockoutResetFile = path.join(dataDir, ".lockout_reset");
    fs.writeFileSync(
      lockoutResetFile,
      JSON.stringify({ email: normalizedEmail, timestamp: Date.now() }),
      "utf-8"
    );
  } catch {
    // ignore
  }
}

resetAdminPassword().catch((err) => {
  console.error("Failed to reset admin password:", err?.message || err);
  process.exit(1);
});

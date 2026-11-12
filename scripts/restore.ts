import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import {
  restoreDatabaseBackup,
  MAX_BACKUP_FILE_SIZE_BYTES,
  MAX_BACKUP_USERS,
  MAX_BACKUP_MESSAGES,
} from "../server/db.js";
import { hashPassword } from "../server/auth.js";

async function runRestore() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/restore.ts <path-to-backup.json>");
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`[RESTORE SCRIPT ERROR] Backup file not found at: ${resolvedPath}`);
    process.exit(1);
  }

  try {
    // 1. Strict file size validation
    const fileStats = fs.statSync(resolvedPath);
    if (fileStats.size > MAX_BACKUP_FILE_SIZE_BYTES) {
      console.error(
        `[RESTORE SCRIPT ERROR] File size (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed size of 10 MB.`
      );
      process.exit(1);
    }

    // 2. Read and parse JSON content
    const rawContent = fs.readFileSync(resolvedPath, "utf-8");
    let backupData: any;
    try {
      backupData = JSON.parse(rawContent);
    } catch (parseErr: any) {
      console.error("[RESTORE SCRIPT ERROR] Invalid JSON syntax in backup file:", parseErr?.message || parseErr);
      process.exit(1);
    }

    console.log("------------------------------------------");
    console.log(" Starting Database Restore Procedure");
    console.log(` - Source file: ${resolvedPath}`);
    console.log(` - File size: ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(` - Allowed limits: Max ${MAX_BACKUP_USERS} users, Max ${MAX_BACKUP_MESSAGES} messages`);
    console.log("------------------------------------------");

    // 3. Execute restore with automatic pre-restore backup and strict validation
    const result = await restoreDatabaseBackup(backupData, hashPassword);

    console.log("==========================================");
    console.log(" SQLite Database Backup Restored Successfully");
    console.log("==========================================");
    if (result.preRestoreBackup) {
      console.log(`- Auto pre-restore backup saved at: ${result.preRestoreBackup.filePath}`);
      console.log(`- Pre-restore snapshot count: ${result.preRestoreBackup.counts.users} users, ${result.preRestoreBackup.counts.messages} messages`);
    }
    console.log(`- Restored/updated users: ${result.restoredUsers}`);
    console.log(`- Restored chat messages: ${result.restoredMessages}`);
    console.log("==========================================");
  } catch (err: any) {
    console.error("[RESTORE SCRIPT ERROR] Restore failed:", err?.message || err);
    process.exit(1);
  }
}

runRestore();


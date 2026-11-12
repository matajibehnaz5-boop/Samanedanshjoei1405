import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createOnlineDatabaseBackup, exportDatabaseBackup, getDbPath } from "../server/db.js";

async function runBackup() {
  try {
    const backupDir = path.resolve(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const customArg = process.argv[2] ? path.resolve(process.argv[2]) : null;

    console.log("==========================================");
    console.log(" Starting SQLite Online Backup Procedure ");
    console.log("==========================================");
    console.log(`- Active Database: ${getDbPath()}`);

    if (customArg && customArg.endsWith(".json")) {
      // Export JSON backup only
      const data = exportDatabaseBackup();
      fs.writeFileSync(customArg, JSON.stringify(data, null, 2), "utf-8");
      console.log(`[JSON EXPORT] Backup written to: ${customArg}`);
      console.log(`- Users count: ${data.counts.users}`);
      console.log(`- Chat messages count: ${data.counts.messages}`);
    } else if (customArg && (customArg.endsWith(".db") || customArg.endsWith(".sqlite"))) {
      // Create SQLite online backup only
      const onlineBackup = createOnlineDatabaseBackup(customArg);
      console.log(`[ONLINE SQLITE BACKUP] Atomic snapshot created at: ${onlineBackup.backupPath}`);
      console.log(`- Size: ${(onlineBackup.fileSizeBytes / 1024).toFixed(2)} KB`);
      console.log("- WAL mode: Live transaction frames safely checkpointed into standalone DB file.");
    } else {
      // Standard run: Create both the SQLite online binary backup AND the JSON portable export
      const targetDbPath = customArg || path.join(backupDir, `backup-${timestamp}.db`);
      const targetJsonPath = path.join(backupDir, `backup-${timestamp}.json`);

      // 1. SQLite Online Backup (safe under live WAL mode)
      const onlineBackup = createOnlineDatabaseBackup(targetDbPath);
      console.log(`[ONLINE SQLITE BACKUP] Atomic snapshot created at: ${onlineBackup.backupPath}`);
      console.log(`- File size: ${(onlineBackup.fileSizeBytes / 1024).toFixed(2)} KB`);
      console.log("- Status: WAL frames integrated into standalone database file without reader/writer locks.");

      // 2. Portable JSON export
      const jsonData = exportDatabaseBackup();
      fs.writeFileSync(targetJsonPath, JSON.stringify(jsonData, null, 2), "utf-8");
      console.log(`[JSON PORTABLE EXPORT] Created at: ${targetJsonPath}`);
      console.log(`- Users count: ${jsonData.counts.users}`);
      console.log(`- Messages count: ${jsonData.counts.messages}`);
    }

    console.log("==========================================");
    console.log(" Backup Completed Successfully");
    console.log("==========================================");
  } catch (err: any) {
    console.error("[BACKUP SCRIPT ERROR] Backup failed:", err?.message || err);
    process.exit(1);
  }
}

runBackup();

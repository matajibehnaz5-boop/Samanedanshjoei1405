import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { apiRouter } from "./server/api.js";
import { initAdminUser } from "./server/db.js";
import { hashPassword } from "./server/auth.js";

const rootDir = process.cwd();

/**
 * Validates security requirements for production deployments.
 * Refuses to start if critical security configurations are missing or weak.
 */
function validateProductionSecurity(): void {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) return;

  const sessionSecret = process.env.SESSION_SECRET?.trim();
  const weakSessionSecrets = [
    "secret",
    "session_secret",
    "changeme",
    "password",
    "12345678",
    "123456789",
    "admin",
    "default",
    "test",
    "development",
    "supersecret",
    "vazir_session_secret",
  ];

  if (!sessionSecret) {
    console.error(
      "[FATAL SECURITY ERROR] In production mode (NODE_ENV=production), SESSION_SECRET must be explicitly set in environment variables."
    );
    process.exit(1);
  }

  if (sessionSecret.length < 32) {
    console.error(
      `[FATAL SECURITY ERROR] In production mode, SESSION_SECRET is too short (${sessionSecret.length} characters). It must be at least 32 characters long.`
    );
    process.exit(1);
  }

  if (weakSessionSecrets.includes(sessionSecret.toLowerCase())) {
    console.error(
      "[FATAL SECURITY ERROR] In production mode, SESSION_SECRET cannot be a common placeholder phrase."
    );
    process.exit(1);
  }

  if (/^(.)\1+$/.test(sessionSecret)) {
    console.error(
      "[FATAL SECURITY ERROR] In production mode, SESSION_SECRET cannot consist of repeated single characters."
    );
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const weakAdminPasswords = [
    "admin",
    "admin123",
    "password",
    "password123",
    "123456",
    "12345678",
    "1234567890",
    "vazir",
    "vazir123",
    "changeme",
    "secret",
  ];

  if (adminEmail && !adminPassword) {
    console.error(
      "[FATAL SECURITY ERROR] In production mode, ADMIN_EMAIL is set but ADMIN_PASSWORD is missing."
    );
    process.exit(1);
  }

  if (adminPassword) {
    if (adminPassword.length < 12) {
      console.error(
        `[FATAL SECURITY ERROR] In production mode, ADMIN_PASSWORD is too weak (${adminPassword.length} characters). It must be at least 12 characters long.`
      );
      process.exit(1);
    }

    if (weakAdminPasswords.includes(adminPassword.toLowerCase())) {
      console.error(
        "[FATAL SECURITY ERROR] In production mode, ADMIN_PASSWORD cannot be a common or predictable default password."
      );
      process.exit(1);
    }
  }
}

async function startServer() {
  // Enforce production security rules before anything runs
  validateProductionSecurity();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Requirement 9: Configure trust proxy (off by default unless explicitly configured)
  const trustProxyEnv = process.env.TRUST_PROXY?.trim();
  if (trustProxyEnv) {
    if (trustProxyEnv === "true") {
      app.set("trust proxy", true);
    } else if (/^\d+$/.test(trustProxyEnv)) {
      app.set("trust proxy", Number(trustProxyEnv));
    } else if (trustProxyEnv === "false" || trustProxyEnv === "0") {
      app.set("trust proxy", false);
    } else {
      app.set("trust proxy", trustProxyEnv);
    }
  } else {
    app.set("trust proxy", false);
  }

  app.use(express.json({ limit: "10mb" }));

  // Initialize admin user if credentials provided in environment
  try {
    await initAdminUser(hashPassword);
  } catch (dbErr: any) {
    console.error(
      `[CRITICAL STARTUP ERROR] Failed to initialize SQLite database or admin user. Check filesystem permissions for DATA_DIR: ${dbErr?.message || dbErr}`
    );
  }

  // Mount self-hosted JSON API before Vite middleware
  app.use("/api", apiRouter);

  // Initialize Gemini client lazily/safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API route for chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, language } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid request body format" });
      }

      const isFa = language === "fa";

      const systemInstruction = `You are the official AI Student Assistant ("دستیار هوشمند دانشجویی") for Vazir University ("دانشگاه صنعتی وزیر") student portal.
Your primary role is to assist university students with all academic and campus affairs, including:
1. Grades & Report Cards ("نمرات و کارنامه"): Semester GPA, passed credits, grade appeals.
2. Tuition & Financials ("شهریه و امور مالی"): Installment deadlines, tuition balance, online payment gateway, wallet recharge.
3. Course Registration ("انتخاب واحد"): Prerequisite checks, capacity limits, class schedules, drop/add deadlines.
4. Dormitory Housing ("خوابگاه"): Dorm request submission, room selection, floor regulations, resident passes.
5. Student Loans ("وام تحصیلی"): Tuition loans, housing loans, essential needs loans, repayment rules, registration deadlines.
6. Meal Reservations & Dining ("تغذیه و کارت غذا"): Weekly menu reservations, meal prices (Lunch 35,000 to 55,000 Tomans, Dinner 20,000 to 32,000 Tomans), dining card recharge.
7. Student ID Card ("کارت دانشجویی"): Annual validity renewal, duplicate card requests (lost or damaged card fee 150,000 Tomans).

Tone & Style:
- Extremely helpful, polite, respectful, clear, and encouraging.
- Use clear markdown formatting, bullet points, or bold text for readability.
- ${isFa ? "Respond primarily in fluent, natural Persian." : "Respond in clear, professional English."}
- Maintain context from the previous conversation history provided in the request.`;

      // Format history for Gemini
      const contents = messages.map((m: { role: string; text: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || (isFa ? "متأسفانه پاسخی دریافت نشد." : "No response was generated.");

      return res.json({ reply: responseText });
    } catch (error: any) {
      console.error("Gemini Chat API Error:", error);
      return res.status(500).json({
        error: "Failed to generate AI response",
        message: error?.message || "Internal server error",
      });
    }
  });

  // Health check endpoint (returns { ok: true } without any user data)
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // In production, serve built static files; in development, mount Vite middleware
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(rootDir, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

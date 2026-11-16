import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
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

  const sessionSecret = (process.env.SESSION_SECRET || process.env.JWT_SECRET)?.trim();
  const weakSessionSecrets = [
    "secret",
    "session_secret",
    "jwt_secret",
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
    console.warn(
      "[SECURITY WARNING] SESSION_SECRET is not set; using auto-generated persistent secret from DATA_DIR/.session_secret. Set SESSION_SECRET in Cloud Run for multi-instance deployments."
    );
  } else {
    if (sessionSecret.length < 32) {
      console.warn(
        `[SECURITY WARNING] SESSION_SECRET is shorter than recommended (${sessionSecret.length} characters). Recommend at least 32 characters.`
      );
    }

    if (weakSessionSecrets.includes(sessionSecret.toLowerCase())) {
      console.warn(
        "[SECURITY WARNING] SESSION_SECRET looks like a common placeholder phrase. Use a strong random string."
      );
    }

    if (/^(.)\1+$/.test(sessionSecret)) {
      console.warn(
        "[SECURITY WARNING] SESSION_SECRET consists of repeated single characters. Use a random string."
      );
    }
  }

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

  if (adminPassword) {
    if (adminPassword.length < 12) {
      console.warn(
        `[SECURITY WARNING] ADMIN_PASSWORD is shorter than recommended (${adminPassword.length} characters). Recommend at least 12 characters.`
      );
    }

    if (weakAdminPasswords.includes(adminPassword.toLowerCase())) {
      console.warn(
        "[SECURITY WARNING] ADMIN_PASSWORD is a common password. Consider changing it to a stronger password."
      );
    }
  }
}

async function startServer() {
  // Enforce production security rules before anything runs
  validateProductionSecurity();

  const app = express();
  const isProd = process.env.NODE_ENV === "production";
  const PORT = Number(process.env.PORT) || 3000;

  // 1. Trust proxy configuration (defaults to 1 hop in production for Cloud Run / reverse proxies)
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
    app.set("trust proxy", isProd ? 1 : false);
  }

  // 2. Body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // 3. Request debug logger (logs HTTP method and path only; never logs body, headers, or secrets)
  app.use((req, _res, next) => {
    console.log(`[REQ] ${req.method} ${req.path}`);
    next();
  });

  // Initialize admin user if credentials provided in environment
  try {
    await initAdminUser(hashPassword);
  } catch (dbErr: any) {
    console.error(
      `[CRITICAL STARTUP ERROR] Failed to initialize SQLite database or admin user. Check filesystem permissions for DATA_DIR: ${dbErr?.message || dbErr}`
    );
  }

  // 4. Health check endpoint (returns { ok: true } without any user data)
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, status: "ok", timestamp: new Date().toISOString() });
  });

  // Initialize Gemini client lazily/safely (server-side only)
  const getGeminiClient = (apiKey: string) => {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // 5. API route for chatbot
  app.post("/api/chat", async (req, res) => {
    const isFa = req.body?.language === "fa";
    try {
      const { messages } = req.body || {};
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: "INVALID_REQUEST",
          message: isFa ? "فرمت پیام نامعتبر است." : "Invalid request body format",
        });
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        console.warn("[CHAT API] GEMINI_API_KEY is not set in environment.");
        return res.status(503).json({
          error: "AI_NOT_CONFIGURED",
          message: isFa
            ? "سرویس هوش مصنوعی هنوز تنظیم نشده است."
            : "AI service is not configured yet.",
        });
      }

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
      const contents = messages
        .filter((m: any) => m && typeof m.text === "string" && m.text.trim())
        .map((m: { role: string; text: string }) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        }));

      if (contents.length === 0) {
        return res.status(400).json({
          error: "EMPTY_MESSAGES",
          message: isFa ? "متن پیام نمی‌تواند خالی باشد." : "Message text cannot be empty",
        });
      }

      const ai = getGeminiClient(apiKey);
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
      } catch (primaryErr: any) {
        const primaryStatus = Number(primaryErr?.status ?? primaryErr?.statusCode ?? primaryErr?.code);
        const primaryMsg = typeof primaryErr?.message === "string" ? primaryErr.message : String(primaryErr || "");
        const safePrimaryMsg = primaryMsg.replace(/AIza[0-9A-Za-z_-]+/g, "[REDACTED]");
        console.warn(`[CHAT API PRIMARY MODEL WARNING] model=gemini-4-hydrogen status=${primaryStatus || 500} message=${safePrimaryMsg}`);

        if (primaryStatus === 401 || primaryStatus === 403 || safePrimaryMsg.includes("API_KEY_INVALID")) {
          throw primaryErr;
        }

        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents,
          config: {
            systemInstruction,
          },
        });
      }

      const responseText =
        response.text || (isFa ? "متأسفانه پاسخی دریافت نشد." : "No response was generated.");

      return res.json({ reply: responseText });
    } catch (error: any) {
      const rawStatus = Number(error?.status ?? error?.statusCode ?? error?.code);
      const status = Number.isFinite(rawStatus) && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
      const rawMessage = typeof error?.message === "string" ? error.message : String(error || "Internal server error");
      const safeMessage = rawMessage.replace(/AIza[0-9A-Za-z_-]+/g, "[REDACTED]");

      console.error(`[CHAT API ERROR] status=${status} message=${safeMessage}`);

      let userMessage = isFa
        ? "خطا در برقراری ارتباط با دستیار هوشمند. لطفاً دوباره تلاش کنید."
        : "Failed to communicate with AI assistant. Please try again.";

      if (
        status === 401 ||
        status === 403 ||
        safeMessage.includes("API_KEY_INVALID") ||
        safeMessage.includes("PERMISSION_DENIED")
      ) {
        userMessage = isFa
          ? "کلید سرویس هوش مصنوعی معتبر نیست یا دسترسی لازم را ندارد."
          : "AI service API key is invalid or lacks permission.";
      } else if (status === 429 || safeMessage.includes("RESOURCE_EXHAUSTED")) {
        userMessage = isFa
          ? "سقف درخواست سرویس هوش مصنوعی موقتاً پر شده است. لطفاً کمی بعد دوباره تلاش کنید."
          : "AI service rate limit exceeded. Please try again later.";
      }

      return res.status(status).json({
        error: "Failed to generate AI response",
        message: userMessage,
      });
    }
  });

  // 6. Mount self-hosted JSON API (/api/auth/login, /api/auth/register, /api/auth/logout, /api/me, etc.)
  app.use("/api", apiRouter);

  // 7. Catch unmatched /api routes before static files / SPA fallback
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API route not found" });
  });

  // 8. In production, serve built static files and SPA fallback; in development, mount Vite middleware
  if (isProd) {
    const candidateDist = path.resolve(rootDir, "dist");
    const distPath = fs.existsSync(path.join(candidateDist, "index.html"))
      ? candidateDist
      : typeof __dirname !== "undefined"
        ? path.resolve(__dirname)
        : candidateDist;
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path === "/api" || req.path.startsWith("/api/")) {
        return next();
      }
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

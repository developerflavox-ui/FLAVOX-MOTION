import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Client } from "magic-hour";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

app.use(express.static(path.join(__dirname, "public")));
app.use("/outputs", express.static(outputDir, { maxAge: "1h" }));

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Please upload a JPG, PNG, WEBP, or AVIF image."));
    }
    cb(null, true);
  }
});

function publicVideoUrl(filePath) {
  const name = path.basename(filePath);
  return `/outputs/${encodeURIComponent(name)}`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, apiKeyConfigured: Boolean(process.env.MAGIC_HOUR_API_KEY) });
});

app.post("/api/generate", upload.single("image"), async (req, res) => {
  let uploadedImagePath;
  try {
    if (!process.env.MAGIC_HOUR_API_KEY) {
      return res.status(503).json({
        error: "Magic Hour API key is not configured. Copy .env.example to .env and add your new key."
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Choose an image first." });
    }

    uploadedImagePath = req.file.path;
    const prompt = String(req.body.prompt || "").trim();
    const duration = Number(req.body.duration || 5);
    const resolution = String(req.body.resolution || "480p");
    const allowedDurations = [5, 10];
    const allowedResolutions = ["480p", "720p"];
    if (!prompt) return res.status(400).json({ error: "Write a motion prompt first." });
    if (!allowedDurations.includes(duration)) {
      return res.status(400).json({ error: "Duration must be 5 or 10 seconds." });
    }
    if (!allowedResolutions.includes(resolution)) {
      return res.status(400).json({ error: "Choose a supported resolution." });
    }

    const client = new Client({ token: process.env.MAGIC_HOUR_API_KEY });
    const jobName = `FLAVOX MOTION ${new Date().toISOString()}`;
    const result = await client.v1.imageToVideo.generate({
      name: jobName,
      endSeconds: duration,
      resolution,
      assets: { imageFilePath: uploadedImagePath },
      style: { prompt, highQuality: true },
      model: "kling-3.0"
    }, {
      waitForCompletion: true,
      downloadOutputs: true,
      downloadDirectory: outputDir
    });

    let downloaded = result?.downloadedPaths || result?.downloaded_paths || [];
    if (!Array.isArray(downloaded)) downloaded = [downloaded];
    let videoPath = downloaded.find(p => typeof p === "string" && /\.(mp4|webm|mov)$/i.test(p));

    if (!videoPath) {
      const names = await fs.readdir(outputDir);
      const candidates = await Promise.all(names
        .filter(n => /\.(mp4|webm|mov)$/i.test(n))
        .map(async n => ({ p: path.join(outputDir, n), stat: await fs.stat(path.join(outputDir, n)) })));
      candidates.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
      videoPath = candidates[0]?.p;
    }

    if (!videoPath) {
      return res.status(502).json({
        error: "The API job returned, but no downloaded video file was found. Check the Magic Hour project in your dashboard before retrying to avoid duplicate charges.",
        projectId: result?.id || null,
        status: result?.status || null
      });
    }

    const finalName = `${Date.now()}-${randomUUID().slice(0, 8)}${path.extname(videoPath) || ".mp4"}`;
    const finalPath = path.join(outputDir, finalName);
    if (path.resolve(videoPath) !== path.resolve(finalPath)) {
      await fs.copyFile(videoPath, finalPath);
    }
    return res.json({
      ok: true,
      message: "Video generation complete.",
      projectId: result?.id || null,
      status: result?.status || "completed",
      videoUrl: publicVideoUrl(finalPath)
    });
  } catch (err) {
    let detail = err?.message || "Unknown error";
    try {
      if (err?.response) {
        const body = await err.response.clone().json();
        detail = body?.message || body?.error || detail;
      }
    } catch {}
    console.error("Image-to-video error:", detail);
    return res.status(500).json({
      error: `Generation failed: ${detail}. Check your API key, account credits, model access, and Magic Hour status.`
    });
  } finally {
    if (uploadedImagePath) {
      await fs.unlink(uploadedImagePath).catch(() => {});
    }
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Image is too large. Maximum upload size is 12 MB." });
  }
  res.status(400).json({ error: err.message || "Upload failed." });
});

app.listen(PORT, () => {
  console.log(`FLAVOX MOTION is running at http://localhost:${PORT}`);
  if (!process.env.MAGIC_HOUR_API_KEY) console.warn("Set MAGIC_HOUR_API_KEY in .env before generating.");
});
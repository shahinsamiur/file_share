const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const qrcode = require("qrcode");

const app = express();
const PORT = 3000;

// Directory to share — defaults to ~/Downloads, or create a "shared" folder
const SHARE_DIR = process.env.SHARE_DIR || path.join(os.homedir(), "Downloads");

// Make sure it exists
if (!fs.existsSync(SHARE_DIR)) {
  fs.mkdirSync(SHARE_DIR, { recursive: true });
}

// Get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// File type detection
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    video: [".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv", ".m4v"],
    audio: [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"],
    image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"],
    pdf: [".pdf"],
    doc: [".doc", ".docx", ".odt", ".txt", ".rtf", ".md"],
    sheet: [".xls", ".xlsx", ".csv", ".ods"],
    archive: [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"],
    code: [".js", ".ts", ".py", ".html", ".css", ".json", ".xml", ".sh"],
    apk: [".apk"],
  };
  for (const [type, exts] of Object.entries(types)) {
    if (exts.includes(ext)) return type;
  }
  return "other";
}

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// API: list files
app.get("/api/files", (req, res) => {
  const subpath = req.query.path || "";
  const fullPath = path.join(SHARE_DIR, subpath);

  // Security: prevent directory traversal
  if (!fullPath.startsWith(SHARE_DIR)) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    const files = entries.map((entry) => {
      const filePath = path.join(fullPath, entry.name);
      let size = 0;
      let modified = null;
      try {
        const stat = fs.statSync(filePath);
        size = stat.size;
        modified = stat.mtime;
      } catch {}

      return {
        name: entry.name,
        isDirectory: entry.isDirectory(),
        size,
        sizeFormatted: entry.isDirectory() ? "—" : formatSize(size),
        type: entry.isDirectory() ? "folder" : getFileType(entry.name),
        ext: path.extname(entry.name).toLowerCase(),
        modified,
        path: subpath ? `${subpath}/${entry.name}` : entry.name,
      };
    });

    // Folders first, then files
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ files, currentPath: subpath, shareDir: SHARE_DIR });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: download file
app.get("/api/download", (req, res) => {
  const filePath = req.query.path || "";
  const fullPath = path.join(SHARE_DIR, filePath);

  if (!fullPath.startsWith(SHARE_DIR)) {
    return res.status(403).send("Access denied");
  }

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    return res.status(404).send("File not found");
  }

  res.download(fullPath, path.basename(fullPath));
});

// API: stream file (for inline viewing)
app.get("/api/stream", (req, res) => {
  const filePath = req.query.path || "";
  const fullPath = path.join(SHARE_DIR, filePath);

  if (!fullPath.startsWith(SHARE_DIR)) {
    return res.status(403).send("Access denied");
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).send("File not found");
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(fullPath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(fullPath).pipe(res);
  }
});

// API: QR code for URL
app.get("/api/qr", async (req, res) => {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}`;
  try {
    const qr = await qrcode.toDataURL(url, { width: 200, margin: 1 });
    res.json({ qr, url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve the HTML UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  const ip = getLocalIP();
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║         📂  FileDrop Server            ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║  Local:   http://localhost:${PORT}         ║`);
  console.log(`║  Network: http://${ip}:${PORT}       ║`);
  console.log(`║  Sharing: ${SHARE_DIR}`);
  console.log("╠════════════════════════════════════════╣");
  console.log("║  Scan QR from your phone to connect!  ║");
  console.log("╚════════════════════════════════════════╝\n");
});

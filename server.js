const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static("public"));

// Ensure upload directories exist
const videoDir = "public/UploadedVideos";
const thumbnailDir = "public/UploadedThumbnails";

if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
if (!fs.existsSync(thumbnailDir)) fs.mkdirSync(thumbnailDir, { recursive: true });

// Path for videos metadata JSON file
const videosJsonPath = path.join(__dirname, "videos.json");

// Helper functions to read/write video metadata
function readVideos() {
  if (fs.existsSync(videosJsonPath)) {
    const data = fs.readFileSync(videosJsonPath);
    try {
      return JSON.parse(data);
    } catch (err) {
      console.error("Error parsing videos.json:", err);
      return [];
    }
  }
  return [];
}

function writeVideos(videos) {
  fs.writeFileSync(videosJsonPath, JSON.stringify(videos, null, 2));
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith("video/")) {
      cb(null, videoDir);
    } else if (file.mimetype.startsWith("image/")) {
      cb(null, thumbnailDir);
    } else {
      cb(new Error("Invalid file type"), null);
    }
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // Limit file size to 10GB
});

// Upload route: save files and metadata
app.post("/upload", upload.fields([{ name: "video" }, { name: "thumbnail" }]), (req, res) => {
  try {
    if (!req.files || !req.files.video || !req.files.thumbnail) {
      return res.status(400).json({ message: "Please upload both a video and a thumbnail." });
    }
    const title = req.body.title;
    if (!title) {
      return res.status(400).json({ message: "Video title is required." });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail[0];

    // Create video metadata object
    const videoObj = {
      id: Date.now().toString(),
      title: title,
      videoUrl: `/UploadedVideos/${videoFile.filename}`,
      thumbnailUrl: `/UploadedThumbnails/${thumbnailFile.filename}`,
      likes: 0,
      uploadedAt: new Date().toISOString()
    };

    // Save metadata to videos.json
    const videos = readVideos();
    videos.push(videoObj);
    writeVideos(videos);

    console.log("Video uploaded:", videoObj);
    res.json({ message: "Files uploaded successfully!", video: videoObj });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// Get all videos
app.get("/videos", (req, res) => {
  const videos = readVideos();
  res.json(videos);
});

// Delete a video by id
app.delete("/videos/:id", (req, res) => {
  const videoId = req.params.id;
  let videos = readVideos();
  const videoIndex = videos.findIndex(v => v.id === videoId);
  if (videoIndex === -1) {
    return res.status(404).json({ message: "Video not found." });
  }
  const video = videos[videoIndex];

  // Remove video and thumbnail files
  const videoPath = path.join(__dirname, "public", video.videoUrl);
  const thumbnailPath = path.join(__dirname, "public", video.thumbnailUrl);
  if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
  if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);

  // Remove metadata and update JSON file
  videos.splice(videoIndex, 1);
  writeVideos(videos);
  res.json({ message: "Video deleted successfully." });
});

// Like a video by id
app.post("/videos/:id/like", (req, res) => {
  const videoId = req.params.id;
  let videos = readVideos();
  const video = videos.find(v => v.id === videoId);
  if (!video) {
    return res.status(404).json({ message: "Video not found." });
  }
  video.likes += 1;
  writeVideos(videos);
  res.json(video);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

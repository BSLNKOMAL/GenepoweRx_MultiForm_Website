const multer = require('multer');
const path   = require('path');

// ── Use memory storage — files stored as Buffer in req.files[].buffer ──
// This allows us to save files directly to MongoDB in byte/Buffer format
// instead of writing to the filesystem
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type ${ext} not allowed`));
};

const uploadMiddleware = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter
});

module.exports = uploadMiddleware;
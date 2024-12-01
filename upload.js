const express = require("express");
const multer = require("multer");
const archiver = require("archiver");
const fs = require("fs-extra");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config(); // Load environment variables

const app = express();
const PORT = 5001;
app.use(cors());
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
   cloud_name: process.env.CLOUD_NAME || "dxbtgsvg3",
   api_key: process.env.API_KEY || "869647118413889",
   api_secret: process.env.API_SECRET || "fzocj5j778T_HrUvpMsBvRq74ek",
});

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir);
}

// Multer configuration
const storage = multer.diskStorage({
   destination: (req, file, cb) => cb(null, uploadDir),
   filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// API for folder upload
app.post("/upload-folder", upload.array("folder"), async (req, res) => {
   try {
      if (!req.files || req.files.length === 0) {
         return res.status(400).json({ message: "No files uploaded." });
      }

      const { file_name } = req.body; // Extract file name from the request
      if (!file_name) {
         return res.status(400).json({ message: "File name is required." });
      }

      const zipFilePath = path.join(__dirname, `${file_name}.zip`);

      // Create a ZIP archive
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(output);
      req.files.forEach((file) => {
         archive.file(file.path, { name: file.originalname });
      });
      await archive.finalize();

      // Upload ZIP to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(zipFilePath, {
         resource_type: "raw",
         folder: "folders",
         public_id: file_name, // Use file name as the public ID
      });

      // Cleanup
      fs.emptyDirSync(uploadDir);
      fs.removeSync(zipFilePath);

      res.status(200).json({
         message: "Folder uploaded successfully.",
         downloadUrl: uploadResult.secure_url,
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error uploading folder", error });
   }
});

app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
});

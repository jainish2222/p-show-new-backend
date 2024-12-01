require("dotenv").config();
const express = require("express");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const app = express();
const PORT = 3001;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || "dxbtgsvg3",
    api_key: process.env.API_KEY || "869647118413889",
    api_secret: process.env.API_SECRET || "fzocj5j778T_HrUvpMsBvRq74ek",
 });

// Route to download a file by Public ID
app.get("/download/:publicId", async (req, res) => {
    const publicId = req.params.publicId;
  
    try {
      // Generate the file URL for raw resources
      const fileUrl = cloudinary.url(publicId, {
        resource_type: "raw", // Specify raw type
      });
  
      // Redirect user to the file URL to trigger a download
      res.redirect(fileUrl);
    } catch (error) {
      console.error("Error generating download URL:", error.message);
      res.status(500).json({ error: "Failed to generate download URL" });
    }
  });   
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

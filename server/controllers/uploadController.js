/**
 * UPLOAD CONTROLLER
 * Handles persistent storage of chat media and other files.
 */
const uploadController = {
  /**
   * uploadImage
   * Saves an image and returns its public URL.
   * Multer middleware handles the file saving to /uploads.
   */
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      // We return the path served by the static middleware in app.js
      const url = `/uploads/${req.file.filename}`;
      
      res.status(200).json({ 
        success: true, 
        url,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (err) {
      console.error('[UploadController] Error:', err);
      res.status(500).json({ success: false, error: 'Internal server error during upload' });
    }
  }
};

module.exports = uploadController;

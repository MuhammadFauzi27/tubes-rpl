const UploadController = {
  /**
   * POST /api/v1/uploads/menu
   * Upload gambar menu item, simpan ke folder uploads/menu/.
   * Response: { success: true, data: { image_url: "/uploads/menu/filename.jpg" } }
   */
  async uploadMenuImage(req, res, next) {
    try {
      if (!req.file) {
        const err = new Error("File gambar wajib diupload.");
        err.statusCode = 422;
        throw err;
      }

      // URL relatif yang bisa diakses dari frontend
      const image_url = `/uploads/menu/${req.file.filename}`;

      res.status(201).json({
        success: true,
        data: { image_url },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default UploadController;

import TableService from "../services/tableService.js";

const TableController = {
  async scanQR(req, res, next) {
    try {
      const result = await TableService.scanQR(req.params.token);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        floor: req.query.floor ? parseInt(req.query.floor) : undefined
      };
      const tables = await TableService.getAllTables(filters);
      res.json({
        success: true,
        data: tables
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const table = await TableService.getTableById(req.params.id);
      res.json({
        success: true,
        data: table
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const table = await TableService.createTable(req.body);
      res.status(201).json({
        success: true,
        data: table
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const table = await TableService.updateTable(req.params.id, req.body);
      res.json({
        success: true,
        data: table
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await TableService.deleteTable(req.params.id);
      res.json({
        success: true,
        message: "Operasi berhasil"
      });
    } catch (error) {
      next(error);
    }
  },

  async regenerateQR(req, res, next) {
    try {
      const result = await TableService.regenerateQR(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};

export default TableController;

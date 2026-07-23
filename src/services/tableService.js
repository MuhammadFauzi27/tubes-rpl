import TableRepository from "../repositories/tableRepository.js";
import crypto from "crypto";

const TableService = {
  async scanQR(token) {
    const table = await TableRepository.findByToken(token);
    
    if (!table) {
      const error = new Error("QR code tidak valid atau sudah tidak berlaku");
      error.statusCode = 404;
      error.errorCode = "INVALID_QR_TOKEN";
      throw error;
    }

    if (table.status === 'reserved') {
      const error = new Error("Meja sedang reserved / tidak tersedia");
      error.statusCode = 409;
      error.errorCode = "TABLE_RESERVED";
      throw error;
    }

    // Generate session token: sess_<partial_token>_<timestamp>
    const session_token = `sess_${token.substring(0, 8)}_${Math.floor(Date.now() / 1000)}`;

    return {
      table: {
        id: table.id,
        table_number: table.table_number,
        capacity: table.capacity,
        floor: table.floor
      },
      session_token
    };
  },

  async getAllTables(filters) {
    const { status, floor } = filters;
    const tables = await TableRepository.findAll({ status, floor });
    
    return tables.map(table => this._formatTable(table));
  },

  async getTableById(id) {
    const table = await TableRepository.findById(id);
    if (!table) {
      const error = new Error("Meja tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }
    return this._formatTable(table);
  },

  async createTable(tableData) {
    const existingTable = await TableRepository.findByTableNumber(tableData.table_number);
    if (existingTable) {
      const error = new Error("Nomor meja sudah ada");
      error.statusCode = 409;
      error.errorCode = "CONFLICT";
      throw error;
    }

    const table = await TableRepository.create(tableData);
    return this._formatTable(table);
  },

  async updateTable(id, tableData) {
    const table = await TableRepository.findById(id);
    if (!table) {
      const error = new Error("Meja tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    if (tableData.table_number && tableData.table_number !== table.table_number) {
      const existingTable = await TableRepository.findByTableNumber(tableData.table_number);
      if (existingTable) {
        const error = new Error("Nomor meja sudah ada");
        error.statusCode = 409;
        error.errorCode = "CONFLICT";
        throw error;
      }
    }

    const updatedTable = await TableRepository.update(id, tableData);
    return this._formatTable(updatedTable);
  },

  async deleteTable(id) {
    const table = await TableRepository.findById(id);
    if (!table) {
      const error = new Error("Meja tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    const hasActiveOrders = await TableRepository.hasActiveOrders(id);
    if (hasActiveOrders) {
      const error = new Error("Masih ada pesanan aktif di meja ini");
      error.statusCode = 409;
      error.errorCode = "CONFLICT";
      throw error;
    }

    await TableRepository.delete(id);
  },

  async regenerateQR(id) {
    const table = await TableRepository.findById(id);
    if (!table) {
      const error = new Error("Meja tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    const result = await TableRepository.regenerateQR(id);
    
    return {
      qr_code_token: result.qr_code_token,
      qr_code_url: this._generateQRUrl(result.qr_code_token)
    };
  },

  _formatTable(table) {
    return {
      ...table,
      qr_code_url: this._generateQRUrl(table.table_number)
    };
  },

  _generateQRUrl(token) {
    // Generate QR image URL using external qrserver.com API.
    // The QR encodes the scan URL so customers can scan and be redirected.
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const scanUrl = `${baseUrl}/api/v1/tables/scan/${token}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(scanUrl)}&format=png`;
  }
};

export default TableService;

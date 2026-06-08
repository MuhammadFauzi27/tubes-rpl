import OrderService from "../services/orderService.js";

const OrderController = {
  async getAll(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        date: req.query.date,
        page: req.query.page,
        per_page: req.query.per_page
      };
      const result = await OrderService.getAllOrders(filters);
      res.json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const order = await OrderService.createOrder(req.body);
      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  async getStatus(req, res, next) {
    try {
      const statusInfo = await OrderService.getOrderStatus(req.params.id);
      res.json({
        success: true,
        data: statusInfo
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status, note } = req.body;
      const order = await OrderService.updateOrderStatus(req.params.id, {
        status,
        note,
        changed_by: req.user.id
      });
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
};

export default OrderController;

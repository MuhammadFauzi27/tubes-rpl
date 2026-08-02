import PaymentService from "../services/paymentService.js";

const PaymentController = {
  async initiate(req, res, next) {
    try {
      const payment = await PaymentService.initiatePayment(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.id);
      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  },

  async webhook(req, res, next) {
    try {
      await PaymentService.handleCallback(req.body);
      res.json({
        received: true
      });
    } catch (error) {
      // For webhooks, we usually want to return 200 even if it fails to stop retries if it's a permanent failure, 
      // but here let's follow standard error handling or return 200 with received: false
      console.error('Webhook processing failed:', error);
      res.status(200).json({
        received: false,
        error: error.message
      });
    }
  },

  /**
   * Konfirmasi pembayaran manual oleh admin (mock — tanpa payment gateway real).
   * PATCH /payments/:id/confirm
   */
  async confirm(req, res, next) {
    try {
      const payment = await PaymentService.confirmPayment(req.params.id);
      res.json({
        success: true,
        message: 'Pembayaran berhasil dikonfirmasi',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }
};

export default PaymentController;

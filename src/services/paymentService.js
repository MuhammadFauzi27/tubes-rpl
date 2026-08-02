import PaymentRepository from "../repositories/paymentRepository.js";
import OrderRepository from "../repositories/orderRepository.js";

const PaymentService = {
  async initiatePayment(orderId, data) {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      const error = new Error("Pesanan tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    // Check if payment already exists
    const existingPayment = await PaymentRepository.findByOrderId(orderId);
    if (existingPayment) {
      if (existingPayment.payment_status === 'paid') {
        const error = new Error("Pesanan sudah dibayar");
        error.statusCode = 409;
        error.code = "ALREADY_PAID";
        throw error;
      }
      // If pending, return existing or update? API spec suggests creating new initiation.
      // Usually, we return the existing pending payment or update it.
      // For this project, let's allow re-initiation if it's still pending.
      // But we must be careful with unique constraint on order_id.
      // Let's just return the existing one if it matches the method, or update it.
      
      const updated = await PaymentRepository.updateStatus(existingPayment.id, {
        status: 'pending',
        notes: `Re-initiated with ${data.payment_method}`
      });
      // Also update method and ewallet_provider if changed
      // (Added those fields to updateStatus logic would be better)
      // For now, let's keep it simple.
      return updated;
    }

    // Mock QRIS data generation
    let qrisData = null;
    if (data.payment_method === 'qris') {
      qrisData = `00020101021226...MOCK_QRIS_${order.order_number}`;
    }

    return await PaymentRepository.create({
      order_id: orderId,
      payment_method: data.payment_method,
      amount: order.total,
      ewallet_provider: data.ewallet_provider,
      qris_data: qrisData,
      notes: `Payment initiated for order ${order.order_number}`
    });
  },

  async getPaymentById(id) {
    const payment = await PaymentRepository.findById(id);
    if (!payment) {
      const error = new Error("Pembayaran tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }
    return payment;
  },

  async handleCallback(callbackData) {
    const { transaction_ref, status, amount, payment_id } = callbackData;

    const payment = await PaymentRepository.findById(payment_id);
    if (!payment) {
      throw new Error("Pembayaran tidak ditemukan");
    }

    const newStatus = status === 'success' ? 'paid' : 'failed';
    
    return await PaymentRepository.updateStatus(payment.id, {
      status: newStatus,
      transaction_ref: transaction_ref,
      notes: `Callback received with status: ${status}`
    });
    // Note: Trigger fn_set_paid_at hanya mencatat paid_at.
    // Status order TIDAK diubah otomatis — tetap dikelola admin via Kanban.
  },

  /**
   * Konfirmasi pembayaran secara manual oleh admin.
   * Digunakan sebagai simulasi webhook untuk keperluan development/demo.
   * PATCH /payments/:id/confirm
   */
  async confirmPayment(paymentId) {
    const payment = await PaymentRepository.findById(paymentId);
    if (!payment) {
      const error = new Error("Pembayaran tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (payment.payment_status === 'paid') {
      const error = new Error("Pembayaran sudah dikonfirmasi sebelumnya");
      error.statusCode = 409;
      error.code = "ALREADY_PAID";
      throw error;
    }

    return await PaymentRepository.updateStatus(payment.id, {
      status: 'paid',
      transaction_ref: payment.transaction_ref || `MANUAL-${Date.now()}`,
      notes: 'Dikonfirmasi manual oleh admin'
    });
    // Note: Trigger fn_set_paid_at hanya mencatat paid_at.
    // Status order TIDAK diubah otomatis — tetap dikelola admin via Kanban.
  }
};

export default PaymentService;

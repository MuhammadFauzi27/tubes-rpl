import OrderRepository from "../repositories/orderRepository.js";
import MenuItemRepository from "../repositories/menuItemRepository.js";
import TableRepository from "../repositories/tableRepository.js";

const OrderService = {
  async getAllOrders(filters) {
    const { status, date, page = 1, per_page = 20 } = filters;
    const offset = (page - 1) * per_page;

    const orders = await OrderRepository.findAll({ status, date, limit: per_page, offset });
    const total = await OrderRepository.countAll({ status, date });

    return {
      data: orders.map(order => ({
        ...order,
        total: parseFloat(order.total),
        item_count: parseInt(order.item_count)
      })),
      meta: {
        total,
        page: parseInt(page),
        per_page: parseInt(per_page),
        total_pages: Math.ceil(total / per_page)
      }
    };
  },

  async getOrderById(id) {
    const order = await OrderRepository.findById(id);
    if (!order) {
      const error = new Error("Pesanan tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    const items = await OrderRepository.findItemsByOrderId(id);

    return this._formatOrderDetails(order, items);
  },

  async createOrder(orderData) {
    const { table_id, items: inputItems, customer_note } = orderData;

    // Verify table exists
    const table = await TableRepository.findById(table_id);
    if (!table) {
      const error = new Error("Meja tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    // Verify all menu items exist and are available
    const menuItemIds = inputItems.map(item => item.menu_item_id);
    const menuItems = await MenuItemRepository.findByIds(menuItemIds);

    if (menuItems.length !== menuItemIds.length) {
      const error = new Error("Satu atau lebih menu item tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    const unavailableItems = menuItems.filter(item => !item.is_available);
    if (unavailableItems.length > 0) {
      const error = new Error(`Menu item tidak tersedia: ${unavailableItems.map(i => i.name).join(", ")}`);
      error.statusCode = 409;
      error.errorCode = "ITEM_NOT_AVAILABLE";
      throw error;
    }

    // Prepare items with snapshot prices
    const itemsToCreate = inputItems.map(inputItem => {
      const menuItem = menuItems.find(m => m.id === inputItem.menu_item_id);
      return {
        menu_item_id: inputItem.menu_item_id,
        quantity: inputItem.quantity,
        unit_price: menuItem.price,
        note: inputItem.note
      };
    });

    const newOrder = await OrderRepository.create({ table_id, customer_note }, itemsToCreate);
    
    // Fetch full details for response
    return await this.getOrderById(newOrder.id);
  },

  async updateOrderStatus(id, statusData) {
    const { status } = statusData;
    const order = await OrderRepository.findById(id);
    
    if (!order) {
      const error = new Error("Pesanan tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    // Validate status transition
    this._validateStatusTransition(order.status, status);

    const updatedOrder = await OrderRepository.updateStatus(id, status);
    
    return {
      ...updatedOrder,
      total: parseFloat(updatedOrder.total),
      item_count: parseInt(await OrderRepository.countAll({ status: undefined, date: undefined })) // This is simplified
    };
  },

  async getOrderStatus(id) {
    const statusInfo = await OrderRepository.getStatus(id);
    if (!statusInfo) {
      const error = new Error("Pesanan tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    return {
      ...statusInfo,
      status_label: this._getStatusLabel(statusInfo.status)
    };
  },

  _formatOrderDetails(order, items) {
    const formattedItems = items.map(item => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      menu_item: {
        id: item.menu_item_id,
        name: item.menu_name,
        image_url: item.menu_image
      },
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      subtotal: parseFloat(item.subtotal),
      note: item.note
    }));

    const formattedOrder = {
      id: order.id,
      order_number: order.order_number,
      table: {
        id: order.table_id,
        table_number: order.table_number,
        capacity: order.capacity,
        floor: order.floor
      },
      status: order.status,
      customer_note: order.customer_note,
      items: formattedItems,
      subtotal: parseFloat(order.subtotal),
      tax_rate: parseFloat(order.tax_rate),
      tax_amount: parseFloat(order.tax_amount),
      total: parseFloat(order.total),
      created_at: order.created_at,
      updated_at: order.updated_at
    };

    if (order.payment_id) {
      formattedOrder.payment = {
        id: order.payment_id,
        order_id: order.id,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        amount: parseFloat(order.payment_amount),
        transaction_ref: order.transaction_ref,
        qris_data: order.qris_data,
        paid_at: order.paid_at
      };
    } else {
      formattedOrder.payment = null;
    }

    return formattedOrder;
  },

  _getStatusLabel(status) {
    const labels = {
      pending: "Pesanan masuk, menunggu konfirmasi",
      confirmed: "Pesanan dikonfirmasi",
      processing: "Pesanan sedang dimasak",
      ready: "Pesanan siap diantar",
      delivered: "Pesanan sudah diantar",
      completed: "Pesanan selesai",
      cancelled: "Pesanan dibatalkan"
    };
    return labels[status] || status;
  },

  _validateStatusTransition(currentStatus, nextStatus) {
    const transitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['ready'],
      ready: ['delivered'],
      delivered: ['completed'],
      completed: [],
      cancelled: []
    };

    if (!transitions[currentStatus].includes(nextStatus)) {
      const error = new Error(`Tidak bisa mengubah status dari '${currentStatus}' ke '${nextStatus}'`);
      error.statusCode = 400;
      error.errorCode = "INVALID_STATUS_TRANSITION";
      throw error;
    }
  }
};

export default OrderService;

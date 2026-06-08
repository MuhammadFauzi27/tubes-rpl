import { DashboardRepository } from "../repositories/index.js";

const DashboardService = {
  async getSummary() {
    const [today, activeOrdersCount, recentOrders] = await Promise.all([
      DashboardRepository.getTodaySummary(),
      DashboardRepository.getActiveOrdersCount(),
      DashboardRepository.getRecentOrders(5)
    ]);

    return {
      today,
      active_orders_count: activeOrdersCount,
      recent_orders: recentOrders
    };
  },

  async getRevenueStats() {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // 7 days including today
    const startDateStr = startDate.toISOString().split('T')[0];

    const [summaryStats, dailyTransactions, topMenuItems] = await Promise.all([
      DashboardRepository.getRevenueStats(startDateStr, endDate),
      DashboardRepository.getDailyTransactions(startDateStr, endDate),
      DashboardRepository.getTopMenuItems(startDateStr, endDate, 10)
    ]);

    return {
      period: {
        start_date: startDateStr,
        end_date: endDate
      },
      summary: {
        ...summaryStats,
        avg_daily_revenue: summaryStats.total_revenue / 7,
        avg_daily_orders: summaryStats.total_orders / 7
      },
      daily_transactions: dailyTransactions,
      top_menu_items: topMenuItems
    };
  }
};

export default DashboardService;

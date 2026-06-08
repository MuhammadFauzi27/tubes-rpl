import { DashboardService } from "../services/index.js";

const DashboardController = {
  async getSummary(req, res, next) {
    try {
      const summary = await DashboardService.getSummary();
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  },

  async getRevenueStats(req, res, next) {
    try {
      const stats = await DashboardService.getRevenueStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

export default DashboardController;

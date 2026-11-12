
const service = require("./analytics.service");

exports.dashboard = async (req, res) => {
  const stats = await service.getDashboardStats();

  res.json({
    success: true,
    data: stats,
  });
};

exports.deliveryReport = async (req, res) => {
  const report = await service.getDeliveryReport(req.query);

  res.json({
    success: true,
    data: report,
  });
};

exports.courierPerformance = async (req, res) => {
  const performance = await service.getCourierPerformance();

  res.json({
    success: true,
    data: { couriers: performance },
  });
};

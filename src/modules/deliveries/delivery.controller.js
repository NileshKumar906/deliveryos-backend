
const service = require("./delivery.service");

// ========================================
// CREATE DELIVERY
// ========================================

exports.create = async (req, res) => {
  const delivery = await service.createDelivery(
    req.validatedBody,
    req.user.id
  );

  res.status(201).json({
    success: true,
    message: "Delivery booked successfully",
    data: { delivery },
  });
};

// ========================================
// GET ALL DELIVERIES
// ========================================

exports.getAll = async (req, res) => {
  const result = await service.getDeliveries(
    req.query,
    req.user
  );

  res.json({
    success: true,
    data: result,
  });
};

// ========================================
// GET SINGLE DELIVERY
// ========================================

exports.getOne = async (req, res) => {
  const delivery = await service.getDeliveryById(
    req.params.id,
    req.user
  );

  res.json({
    success: true,
    data: { delivery },
  });
};

// ========================================
// TRACK DELIVERY
// ========================================

exports.track = async (req, res) => {
  const delivery = await service.getByTrackingId(
    req.params.trackingId,
    req.user
  );

  res.json({
    success: true,
    data: { delivery },
  });
};

// ========================================
// UPDATE DELIVERY STATUS
// ========================================

exports.updateStatus = async (req, res) => {
  const delivery = await service.updateDeliveryStatus(
    req.params.id,
    req.validatedBody
  );

  res.json({
    success: true,
    message: "Delivery status updated",
    data: { delivery },
  });
};

// ========================================
// ARCHIVE DELIVERY
// ========================================

exports.archive = async (req, res) => {
  const delivery = await service.archiveDelivery(
    req.params.id,
    req.validatedBody.isArchived
  );

  res.json({
    success: true,
    message: "Delivery archive status updated",
    data: { delivery },
  });
};


const service = require("./delivery.service");

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

exports.getAll = async (req, res) => {
  const result = await service.getDeliveries(req.query);
  res.json({ success: true, data: result });
};

exports.getOne = async (req, res) => {
  const delivery = await service.getDeliveryById(req.params.id);
  res.json({ success: true, data: { delivery } });
};

exports.track = async (req, res) => {
  const delivery = await service.getByTrackingId(req.params.trackingId);
  res.json({ success: true, data: { delivery } });
};

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

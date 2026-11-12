const dispatchService = require("./dispatch.service");

exports.autoDispatch = async (req, res) => {
  const result = await dispatchService.dispatchDelivery(
    req.params.deliveryId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Delivery dispatched successfully",
    data: result,
  });
};
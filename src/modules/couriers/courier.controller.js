
const service = require("./courier.service");

exports.create = async (req, res) => {
  const courier = await service.createCourier(req.validatedBody);
  res.status(201).json({ success: true, data: { courier } });
};

exports.getAll = async (req, res) => {
  const result = await service.getCouriers(req.query);
  res.json({ success: true, data: result });
};

exports.getOne = async (req, res) => {
  const courier = await service.getCourierById(req.params.id);
  res.json({ success: true, data: { courier } });
};

exports.update = async (req, res) => {
  const courier = await service.updateCourier(
    req.params.id,
    req.validatedBody
  );
  res.json({ success: true, data: { courier } });
};

exports.remove = async (req, res) => {
  await service.deleteCourier(req.params.id);
  res.json({ success: true, message: "Courier deleted successfully" });
};

exports.addLedger = async (req, res) => {
  const entry = await service.addLedgerEntry(
    req.params.id,
    req.validatedBody
  );
  res.status(201).json({ success: true, data: { entry } });
};


const prisma = require("../../config/database");
const AppError = require("../../utils/AppError");
const { Prisma } = require("@prisma/client");

async function createCourier(data) {
  try {
    return await prisma.courier.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002") {
      throw new AppError("Courier phone already exists", 409);
    }
    throw error;
  }
}

async function getCouriers({ page = 1, limit = 10, search }) {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 10));

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ],
    }),
  };

  const [couriers, total] = await prisma.$transaction([
    prisma.courier.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.courier.count({ where }),
  ]);

  return {
    couriers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getCourierById(id) {
  const courier = await prisma.courier.findUnique({
    where: { id },
    include: { ledgerEntries: { orderBy: { createdAt: "desc" } } },
  });

  if (!courier) throw new AppError("Courier not found", 404);
  return courier;
}

async function updateCourier(id, data) {
  await getCourierById(id);

  return prisma.courier.update({
    where: { id },
    data,
  });
}

async function deleteCourier(id) {
  const courier = await getCourierById(id);

  if (courier.totalDeliveries > 0) {
    throw new AppError(
      "Courier has delivery history. Deactivate instead of deleting.",
      409
    );
  }

  return prisma.courier.delete({ where: { id } });
}

async function addLedgerEntry(id, data) {
  return prisma.$transaction(async (tx) => {
    const courier = await tx.courier.findUnique({ where: { id } });

    if (!courier) throw new AppError("Courier not found", 404);

    const amount = new Prisma.Decimal(data.amount);

    const entry = await tx.courierLedger.create({
      data: {
        courierId: id,
        type: data.type,
        amount,
        reason: data.reason,
      },
    });

    await tx.courier.update({
      where: { id },
      data: data.type === "REWARD"
        ? { rewards: { increment: amount } }
        : { penalties: { increment: amount } },
    });

    return entry;
  });
}

module.exports = {
  createCourier,
  getCouriers,
  getCourierById,
  updateCourier,
  deleteCourier,
  addLedgerEntry,
};

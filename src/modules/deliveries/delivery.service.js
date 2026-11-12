
const crypto = require("crypto");
const prisma = require("../../config/database");
const AppError = require("../../utils/AppError");

function generateTrackingId() {
  return `DOS-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

const allowedTransitions = {
  BOOKED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

async function createDelivery(data, userId) {
  return prisma.$transaction(async (tx) => {
    const trackingId = generateTrackingId();

    const delivery = await tx.delivery.create({
      data: {
        ...data,
        trackingId,
        createdById: userId,
        trackingEvents: {
          create: {
            status: "BOOKED",
            description: "Delivery booked successfully",
          },
        },
      },
      include: { trackingEvents: true },
    });

    return delivery;
  });
}

async function getDeliveries({ page = 1, limit = 10, status, search }) {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 10));

  const where = {
    isArchived: false,
    ...(status && { status }),
    ...(search && {
      OR: [
        { trackingId: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
      ],
    }),
  };

  const [deliveries, total] = await prisma.$transaction([
    prisma.delivery.findMany({
      where,
      include: { courier: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.delivery.count({ where }),
  ]);

  return {
    deliveries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getDeliveryById(id) {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      courier: true,
      trackingEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!delivery) throw new AppError("Delivery not found", 404);
  return delivery;
}

async function getByTrackingId(trackingId) {
  const delivery = await prisma.delivery.findUnique({
    where: { trackingId },
    include: {
      trackingEvents: { orderBy: { createdAt: "asc" } },
      courier: true,
    },
  });

  if (!delivery) throw new AppError("Tracking ID not found", 404);
  return delivery;
}


async function updateDeliveryStatus(id, data) {
  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      throw new AppError("Delivery not found", 404);
    }

    if (!allowedTransitions[delivery.status]?.includes(data.status)) {
      throw new AppError(
        `Cannot change delivery status from ${delivery.status} to ${data.status}`,
        400
      );
    }

    const updated = await tx.delivery.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.status === "CANCELLED" && {
          cancellationReason: data.cancellationReason,
        }),
        ...(data.status === "DELIVERED" && {
          deliveredAt: new Date(),
        }),
      },
    });

    await tx.trackingEvent.create({
      data: {
        deliveryId: id,
        status: data.status,
        description:
          data.description ||
          (data.status === "CANCELLED"
            ? data.cancellationReason
            : `Delivery status updated to ${data.status}`),
      },
    });

    if (
      ["DELIVERED", "CANCELLED"].includes(data.status) &&
      delivery.courierId
    ) {
      await tx.courier.update({
        where: { id: delivery.courierId },
        data: {
          isAvailable: true,
          ...(data.status === "DELIVERED" && {
            totalDeliveries: { increment: 1 },
            successfulDeliveries: { increment: 1 },
          }),
          ...(data.status === "CANCELLED" && {
            totalDeliveries: { increment: 1 },
          }),
        },
      });
    }

    return updated;
  });
}


async function archiveDelivery(id, isArchived) {
  await getDeliveryById(id);

  return prisma.delivery.update({
    where: { id },
    data: { isArchived },
  });
}

module.exports = {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  getByTrackingId,
  updateDeliveryStatus,
  archiveDelivery,
};

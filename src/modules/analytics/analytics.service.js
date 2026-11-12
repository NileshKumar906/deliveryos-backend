
const prisma = require("../../config/database");

function getDateRange(from, to) {
  return {
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(`${to}T23:59:59.999Z`) }),
          },
        }
      : {}),
  };
}

async function getDashboardStats() {
  const [
    totalDeliveries,
    booked,
    assigned,
    pickedUp,
    inTransit,
    delivered,
    cancelled,
    revenue,
    courierCount,
    availableCouriers,
  ] = await Promise.all([
    prisma.delivery.count({ where: { isArchived: false } }),
    prisma.delivery.count({ where: { status: "BOOKED", isArchived: false } }),
    prisma.delivery.count({ where: { status: "ASSIGNED", isArchived: false } }),
    prisma.delivery.count({ where: { status: "PICKED_UP", isArchived: false } }),
    prisma.delivery.count({ where: { status: "IN_TRANSIT", isArchived: false } }),
    prisma.delivery.count({ where: { status: "DELIVERED", isArchived: false } }),
    prisma.delivery.count({ where: { status: "CANCELLED", isArchived: false } }),
    prisma.delivery.aggregate({
      where: { status: "DELIVERED", isArchived: false },
      _sum: { price: true },
    }),
    prisma.courier.count({ where: { isActive: true } }),
    prisma.courier.count({
      where: { isActive: true, isAvailable: true },
    }),
  ]);

  return {
    deliveries: {
      total: totalDeliveries,
      booked,
      assigned,
      pickedUp,
      inTransit,
      delivered,
      cancelled,
    },
    revenue: Number(revenue._sum.price || 0),
    couriers: {
      total: courierCount,
      available: availableCouriers,
      busy: courierCount - availableCouriers,
    },
  };
}

async function getDeliveryReport({ from, to }) {
  const where = {
    ...getDateRange(from, to),
    isArchived: false,
  };

  const [total, byStatus, revenue, recentDeliveries] =
    await Promise.all([
      prisma.delivery.count({ where }),

      prisma.delivery.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),

      prisma.delivery.aggregate({
        where: { ...where, status: "DELIVERED" },
        _sum: { price: true },
        _avg: { price: true },
      }),

      prisma.delivery.findMany({
        where,
        select: {
          id: true,
          trackingId: true,
          customerName: true,
          destinationArea: true,
          status: true,
          price: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  return {
    total,
    statusBreakdown: byStatus.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
    revenue: Number(revenue._sum.price || 0),
    averageDeliveryPrice: Number(revenue._avg.price || 0),
    recentDeliveries,
  };
}

async function getCourierPerformance() {
  const couriers = await prisma.courier.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      totalDeliveries: true,
      successfulDeliveries: true,
      rating: true,
      pricePerDelivery: true,
      rewards: true,
      penalties: true,
      isAvailable: true,
    },
    orderBy: { successfulDeliveries: "desc" },
  });

  return couriers.map((courier) => ({
    ...courier,
    rating: Number(courier.rating),
    pricePerDelivery: Number(courier.pricePerDelivery),
    rewards: Number(courier.rewards),
    penalties: Number(courier.penalties),
    successRate: courier.totalDeliveries
      ? Number(
          (
            (courier.successfulDeliveries / courier.totalDeliveries) *
            100
          ).toFixed(2)
        )
      : 0,
  }));
}

module.exports = {
  getDashboardStats,
  getDeliveryReport,
  getCourierPerformance,
};


const { Prisma } = require("@prisma/client");
const prisma = require("../../config/database");
const AppError = require("../../utils/AppError");

function calculateSuccessRate(courier) {
  if (!courier.totalDeliveries) return 0;

  return courier.successfulDeliveries / courier.totalDeliveries;
}

async function dispatchDelivery(deliveryId, userId) {
  const result = await prisma.$transaction(
    async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
      });

      if (!delivery) {
        throw new AppError("Delivery not found", 404);
      }

      if (delivery.status !== "BOOKED" || delivery.courierId) {
        throw new AppError(
          "Delivery is not available for dispatch",
          409
        );
      }

      const couriers = await tx.courier.findMany({
        where: {
          isActive: true,
          isAvailable: true,
          serviceAreas: {
            has: delivery.destinationArea,
          },
        },
      });

      // Record failed dispatch without rolling back the log.
      if (couriers.length === 0) {
        await tx.dispatchLog.create({
          data: {
            deliveryId,
            status: "FAILED",
            selectionReason: "No eligible available courier found",
            eligibleCourierCount: 0,
            metadata: {
              attemptedBy: userId,
            },
          },
        });

        return { dispatchFailure: true };
      }

      // Ranking:
      // 1. Lowest price
      // 2. Highest rating
      // 3. Highest success rate
      // 4. Alphabetical name
      couriers.sort((a, b) => {
        const priceDifference =
          Number(a.pricePerDelivery) -
          Number(b.pricePerDelivery);

        if (priceDifference !== 0) {
          return priceDifference;
        }

        const ratingDifference =
          Number(b.rating) - Number(a.rating);

        if (ratingDifference !== 0) {
          return ratingDifference;
        }

        const successDifference =
          calculateSuccessRate(b) -
          calculateSuccessRate(a);

        if (successDifference !== 0) {
          return successDifference;
        }

        return a.name.localeCompare(b.name);
      });

      const selectedCourier = couriers[0];

      // Atomically claim the selected courier.
      const courierClaim = await tx.courier.updateMany({
        where: {
          id: selectedCourier.id,
          isAvailable: true,
          isActive: true,
        },
        data: {
          isAvailable: false,
        },
      });

      if (courierClaim.count !== 1) {
        throw new AppError(
          "Selected courier was assigned by another request. Retry dispatch.",
          409
        );
      }

      // Atomically claim the delivery.
      const deliveryClaim = await tx.delivery.updateMany({
        where: {
          id: deliveryId,
          status: "BOOKED",
          courierId: null,
        },
        data: {
          courierId: selectedCourier.id,
          status: "ASSIGNED",
        },
      });

      if (deliveryClaim.count !== 1) {
        throw new AppError(
          "Delivery was assigned by another request",
          409
        );
      }

      // Add tracking history.
      await tx.trackingEvent.create({
        data: {
          deliveryId,
          status: "ASSIGNED",
          description: `Assigned to courier ${selectedCourier.name}`,
        },
      });

      const reason =
        "Selected by lowest price, then rating, success rate and name";

      // Record successful dispatch.
      await tx.dispatchLog.create({
        data: {
          deliveryId,
          courierId: selectedCourier.id,
          status: "SUCCESS",
          selectionReason: reason,
          eligibleCourierCount: couriers.length,
          metadata: {
            attemptedBy: userId,
            selectedCourier: selectedCourier.name,
            price: Number(selectedCourier.pricePerDelivery),
            rating: Number(selectedCourier.rating),
            successRate: calculateSuccessRate(selectedCourier),
          },
        },
      });

      return {
        deliveryId,
        trackingId: delivery.trackingId,
        courier: {
          id: selectedCourier.id,
          name: selectedCourier.name,
          phone: selectedCourier.phone,
        },
        eligibleCourierCount: couriers.length,
        selectionReason: reason,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );

  if (result.dispatchFailure) {
    throw new AppError("No eligible courier available", 409);
  }

  return result;
}

module.exports = { dispatchDelivery };

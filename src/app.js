
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const courierRoutes = require("./modules/couriers/courier.routes");
const deliveryRoutes = require("./modules/deliveries/delivery.routes");
const dispatchRoutes = require("./modules/dispatch/dispatch.routes");
const analyticsRoutes = require("./modules/analytics/analytics.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ========================================
// SECURITY MIDDLEWARE
// ========================================

app.use(helmet());

app.use(
  cors({
    origin:
      env.CLIENT_ORIGIN === "*"
        ? "*"
        : env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()),
  })
);

// ========================================
// REQUEST MIDDLEWARE
// ========================================

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan("dev"));

// Explicit request logging
app.use((req, res, next) => {
  const startTime = Date.now();

  console.log(
    `\n[REQUEST] ${req.method} ${req.originalUrl}`
  );

  res.on("finish", () => {
    console.log(
      `[RESPONSE] ${req.method} ${req.originalUrl} | ` +
      `Status: ${res.statusCode} | ` +
      `Time: ${Date.now() - startTime}ms\n`
    );
  });

  next();
});

// ========================================
// RATE LIMITING
// ========================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// ========================================
// HEALTH CHECK
// ========================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DeliveryOS API is running",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// API ROUTES
// ========================================

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/couriers", courierRoutes);
app.use("/api/v1/deliveries", deliveryRoutes);
app.use("/api/v1/dispatch", dispatchRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// Must remain last
// ========================================

app.use(errorHandler);

module.exports = app;

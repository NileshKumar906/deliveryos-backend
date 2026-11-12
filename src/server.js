
const env = require("./config/env");
const app = require("./app");

const HOST = "0.0.0.0";

const server = app.listen(env.PORT, HOST, () => {
  console.log("-----------------------------------");
  console.log("       DeliveryOS Backend");
  console.log("-----------------------------------");
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Port: ${env.PORT}`);
  console.log(`Host: ${HOST}`);
  console.log(`Local URL: http://localhost:${env.PORT}`);
  console.log(`Emulator URL: http://10.0.2.2:${env.PORT}`);
  console.log("-----------------------------------");
});

server.on("error", (error) => {
  console.error("HTTP server error:", error);
});

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down server...`);

  server.close((error) => {
    if (error) {
      console.error("Error while closing server:", error);
      process.exit(1);
    }

    console.log("HTTP server closed successfully.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

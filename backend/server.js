require("dotenv").config(); // must be first line — loads .env before anything else

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./src/routes/auth.routes");
const donationRoutes = require("./src/routes/donation.routes");
const requestRoutes = require("./src/routes/request.routes");
const deliveryRoutes = require("./src/routes/delivery.routes");
const matchRoutes = require("./src/routes/match.routes");
const fraudRoutes = require("./src/routes/fraud.routes");
const adminRoutes = require("./src/routes/admin.routes");
const volunteerRoutes = require("./src/routes/volunteer.routes");
const claudeRoutes = require("./src/routes/claude.routes");

const { errorHandler } = require("./src/middleware/error.middleware");
const logger = require("./src/utils/logger");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

// Socket.io for real-time updates
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://sahaara-ebon.vercel.app",
    methods: ["GET", "POST"],
  },
});

// Make io accessible in routes
app.set("io", io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://sahaara-ebon.vercel.app",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});


app.use("/api/", limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", claudeRoutes);
app.use("/api/volunteers", volunteerRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// ─── Socket.io Events ────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on("join_room", (room) => {
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("volunteer_location_update", (data) => {
    // Broadcast volunteer GPS location to NGO and admin rooms
    io.to("admin")
      .to(`delivery_${data.deliveryId}`)
      .emit("location_updated", data);
  });

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Database & Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info("MongoDB connected successfully");
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = { app, io };

import { Router } from "express";
import { getLocalIpAddress } from "../utils/getIpAddress.js";

const router = Router();

/**
 * GET /api/v1/system/network-info
 * Mengembalikan IP address jaringan lokal server saat ini.
 * Digunakan oleh frontend untuk membangun URL QR yang dinamis
 * sehingga QR selalu sinkron dengan WiFi/hotspot yang sedang aktif.
 */
router.get("/network-info", (req, res) => {
  const ip = getLocalIpAddress();
  const backendPort = process.env.PORT || 3000;
  const frontendPort = process.env.FRONTEND_PORT || 5173;

  res.json({
    success: true,
    data: {
      ip,
      backend_url: `http://${ip}:${backendPort}`,
      frontend_url: `http://${ip}:${frontendPort}`,
    },
  });
});

export default router;

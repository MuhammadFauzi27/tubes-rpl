import createApp from "./app.js"
import config from "./config/index.js"
import { getLocalIpAddress } from "./utils/getIpAddress.js"

const app = createApp()

const server = app.listen(config.PORT, '0.0.0.0', () => {
  const ip = getLocalIpAddress()
  console.info(`✅ Server running:`)
  console.info(`   Local  → http://localhost:${config.PORT}`)
  console.info(`   Network→ http://${ip}:${config.PORT}  ← buka di HP`)
})

server.on("error", (err) => {
  console.error(`Failed to start server: ${err}`)
  process.exit(1)
})

server.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err}`)
  process.exit(1)
})
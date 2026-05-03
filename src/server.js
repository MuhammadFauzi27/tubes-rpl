import createApp from "./app.js"
import config from "./config/index.js"

const app = createApp()

const server = app.listen(config.PORT, () => {
  console.info(`Server running on port ${config.PORT}`)
})

server.on("error", (err) => {
  console.error(`Failed to start server: ${err}`)
  process.exit(1)
})

server.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err}`)
  process.exit(1)
})
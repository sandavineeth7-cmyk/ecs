import { app } from "./app.js";
import { closeDb, initDb } from "./db.js";

const port = Number(process.env.PORT || 8080);
await initDb();
const server = app.listen(port, "0.0.0.0", () => console.log(`Luma API listening on ${port}`));

const shutdown = () => server.close(async () => { await closeDb(); process.exit(0); });
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

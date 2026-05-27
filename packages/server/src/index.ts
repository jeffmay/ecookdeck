import express from "express";
import config from "./config.ts";
import { createDocumentStore } from "./storage/index.ts";
import { createSyncRouter } from "./routes/sync.ts";

const store = createDocumentStore();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use("/sync", createSyncRouter(store));

app.listen(config.PORT, () => {
  console.log(`Recipe Book sync server listening on port ${config.PORT}`);
});

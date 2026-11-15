import express from "express";
import cors from "cors";
import { createClinicalStore } from "./store/clinicalStore.js";
import { createClinicalApi } from "./routes/clinicalApi.js";
import { startClinicalSimulator } from "./services/simulator.js";
import { createNasaNeowsService } from "./services/nasaNeows.js";

const app = express();
const store = createClinicalStore();
const nasaNeowsService = createNasaNeowsService();
app.use(cors({ origin: "http://localhost:5174" }));
app.use(express.json());
app.use("/api/clinical", createClinicalApi(store, nasaNeowsService));
app.get("/health", (_req, res) => res.json({ ok: true, service: "astris-clinical-console" }));
startClinicalSimulator(store);
void nasaNeowsService.refresh();
setInterval(() => { void nasaNeowsService.refresh(); }, 30 * 60 * 1000);
app.listen(5001, () => console.log("ASTRIS clinical console server listening on http://localhost:5001"));

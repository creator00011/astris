import { Router } from "express";
import { appendObservation, createClinicalStore } from "../store/clinicalStore.js";
import { acknowledgeIncident, processObservation, readinessFor, recoverIncident } from "../services/incidentWorkflow.js";

export const createClinicalApi = (store, nasaNeowsService) => {
  const router = Router();
  const getCrew = (id) => store.crew.find((item) => item.id === id);
  const caseFile = (id) => {
    const crew = getCrew(id);
    if (!crew) return null;
    const observations = store.observations.filter((item) => item.crewId === id).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    return { crew, readiness: readinessFor(id, store), latest: observations.at(-1), observations: observations.slice(-20), incidents: store.incidents.filter((item) => item.crewId === id), audit: store.incidents.filter((item) => item.crewId === id).map((item) => ({ id: item.id, status: item.status, updatedAt: item.recoveredAt || item.acknowledgedAt || item.createdAt })), missionContext: { nasa: nasaNeowsService.getStatus(), nearEarthObjects: nasaNeowsService.getContext() } };
  };
  router.get("/crew", (_req, res) => res.json(store.crew));
  router.get("/mission-context", (_req, res) => res.json({ nasa: nasaNeowsService.getStatus(), nearEarthObjects: nasaNeowsService.getContext() }));
  router.get("/crew/:id/case-file", (req, res) => { const result = caseFile(req.params.id); return result ? res.json(result) : res.status(404).json({ error: "Crew member not found" }); });
  router.post("/observations", (req, res) => {
    const crew = getCrew(req.body.crewId);
    if (!crew) return res.status(400).json({ error: "Valid crewId is required" });
    const observation = { ...req.body, id: req.body.id || `OBS-${Date.now()}`, recordedAt: req.body.recordedAt || new Date().toISOString(), source: req.body.source || "manual" };
    appendObservation(store, observation);
    return res.status(201).json({ observation, newIncidents: processObservation(observation, crew, store), caseFile: caseFile(crew.id) });
  });
  router.post("/incidents/:id/acknowledge", (req, res) => {
    const incident = store.incidents.find((item) => item.id === req.params.id);
    if (!incident) return res.status(404).json({ error: "Incident not found" });
    return res.json(acknowledgeIncident(incident));
  });
  router.post("/incidents/:id/recover", (req, res) => {
    const incident = store.incidents.find((item) => item.id === req.params.id);
    if (!incident) return res.status(404).json({ error: "Incident not found" });
    return res.json(recoverIncident(incident));
  });
  router.get("/simulation", (_req, res) => res.json(store.simulation));
  router.post("/simulation", (req, res) => {
    if (!["NOMINAL", "CARDIO", "ENVIRONMENT", "FATIGUE"].includes(req.body.mode)) return res.status(400).json({ error: "Unsupported scenario" });
    store.simulation = { mode: req.body.mode, changedAt: new Date().toISOString() };
    return res.json(store.simulation);
  });
  router.post("/simulation/reset", (_req, res) => {
    const fresh = createClinicalStore();
    Object.assign(store, fresh);
    return res.json(store.simulation);
  });
  return router;
};

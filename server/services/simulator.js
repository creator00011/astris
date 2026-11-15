import { appendObservation, observationForMode } from "../store/clinicalStore.js";
import { processObservation } from "./incidentWorkflow.js";

export const startClinicalSimulator = (store) => setInterval(() => {
  for (const crew of store.crew) {
    const observation = observationForMode(crew, store.simulation.mode);
    appendObservation(store, observation);
    processObservation(observation, crew, store);
  }
}, 4000);

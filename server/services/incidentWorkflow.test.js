import test from "node:test";
import assert from "node:assert/strict";
import { createClinicalStore } from "../store/clinicalStore.js";
import { acknowledgeIncident, processObservation, readinessFor, recoverIncident } from "./incidentWorkflow.js";

const observation = (overrides = {}) => ({ crewId: "ASTRO-01", recordedAt: new Date().toISOString(), pulse: 70, oxygen: 98, co2: 2.4, radiationRate: 0.38, sleep: 7, reaction: 270, fatigue: 2, ...overrides });

test("correlates repeated unsafe observations into one incident", () => {
  const store = createClinicalStore();
  const crew = store.crew[0];
  processObservation(observation({ pulse: 145 }), crew, store);
  processObservation(observation({ pulse: 150 }), crew, store);
  assert.equal(store.incidents.filter((item) => item.type === "CARDIOVASCULAR").length, 1);
  assert.equal(store.incidents[0].observationCount, 2);
});

test("creates a behavioral incident for a slow cognitive response", () => {
  const store = createClinicalStore();
  const crew = store.crew[0];
  const [incident] = processObservation(observation({ reaction: 481 }), crew, store);

  assert.equal(incident.type, "BEHAVIORAL");
  assert.equal(incident.title, "Reduced cognitive readiness");
  assert.equal(incident.severity, "HIGH");
  assert.match(incident.protocol, /reaction-time assessment/);
});

test("incident lifecycle moves from open to acknowledged to recovered", () => {
  const store = createClinicalStore();
  const crew = store.crew[0];
  processObservation(observation({ co2: 5.8 }), crew, store);
  const incident = store.incidents[0];
  acknowledgeIncident(incident);
  assert.equal(incident.status, "ACKNOWLEDGED");
  recoverIncident(incident);
  assert.equal(incident.status, "RECOVERED");
  assert.equal(readinessFor(crew.id, store).label, "READY");
});

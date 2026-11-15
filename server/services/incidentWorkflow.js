const incidentRules = [
  { type: "CARDIOVASCULAR", title: "Cardiovascular instability", protocol: "Measure pulse and oxygen saturation, place crew member at rest, and notify the flight surgeon.", matches: (o) => o.pulse > 135 || o.oxygen < 91 },
  { type: "ENVIRONMENTAL", title: "Closed-environment degradation", protocol: "Inspect CO2 scrubber flow, verify environmental sensors, and move crew to the medical station.", matches: (o) => o.co2 > 5.2 },
  { type: "BEHAVIORAL", title: "Reduced cognitive readiness", protocol: "Start a recovery period, assess sleep debt, and repeat the reaction-time assessment.", matches: (o) => o.sleep < 4.5 || o.reaction > 480 || o.fatigue >= 5 },
  { type: "RADIATION", title: "Elevated radiation exposure", protocol: "Verify dosimeter telemetry and review shelter readiness with the crew.", matches: (o) => o.radiationRate > 0.65 }
];

const lifecycleFor = (incident) => incident.status === "RECOVERED" ? "RECOVERED" : incident.acknowledgedAt ? "ACKNOWLEDGED" : "OPEN";

export const processObservation = (observation, crew, store) => {
  const created = [];
  for (const rule of incidentRules) {
    if (!rule.matches(observation)) continue;
    const active = store.incidents.find((item) => item.crewId === crew.id && item.type === rule.type && item.status !== "RECOVERED");
    if (active) {
      active.lastObservedAt = observation.recordedAt;
      active.observationCount += 1;
      active.status = lifecycleFor(active);
      continue;
    }
    const incident = {
      id: `INC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      crewId: crew.id, type: rule.type, title: rule.title, protocol: rule.protocol,
      severity: rule.type === "CARDIOVASCULAR" || rule.type === "BEHAVIORAL" ? "HIGH" : "MODERATE",
      status: "OPEN", createdAt: observation.recordedAt, lastObservedAt: observation.recordedAt,
      observationCount: 1, acknowledgedAt: null, recoveredAt: null
    };
    store.incidents.push(incident);
    created.push(incident);
  }
  crew.radiationMSv += observation.radiationRate * 0.02;
  return created;
};

export const acknowledgeIncident = (incident) => {
  if (incident.status === "RECOVERED") return incident;
  incident.acknowledgedAt = new Date().toISOString();
  incident.status = "ACKNOWLEDGED";
  return incident;
};

export const recoverIncident = (incident) => {
  incident.recoveredAt = new Date().toISOString();
  incident.status = "RECOVERED";
  return incident;
};

export const readinessFor = (crewId, store) => {
  const active = store.incidents.filter((item) => item.crewId === crewId && item.status !== "RECOVERED");
  const score = Math.max(0, 100 - active.reduce((sum, item) => sum + (item.severity === "HIGH" ? 28 : 15), 0));
  return { score, label: score >= 80 ? "READY" : score >= 50 ? "WATCH" : "INTERVENTION REQUIRED" };
};

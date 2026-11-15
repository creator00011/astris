const crewSeed = [
  { id: "ASTRO-01", name: "Elena Vance", role: "Mission Commander", missionDay: 142, restingHeartRate: 68, radiationMSv: 64.2 },
  { id: "ASTRO-02", name: "Marcus Chen", role: "Flight Surgeon", missionDay: 142, restingHeartRate: 72, radiationMSv: 61.8 }
];

const makeObservation = (crew, index, mode = "NOMINAL") => {
  const wave = Math.sin(index / 3);
  const observation = {
    id: `${crew.id}-${Date.now()}-${index}`, crewId: crew.id, recordedAt: new Date().toISOString(),
    pulse: Math.round(crew.restingHeartRate + wave * 4), oxygen: 98, co2: 2.4,
    radiationRate: 0.38, sleep: 7.4, reaction: 270, fatigue: 2, exercise: 60,
    source: "wearable"
  };
  if (mode === "CARDIO") Object.assign(observation, { pulse: 148, oxygen: 90.5 });
  if (mode === "ENVIRONMENT") Object.assign(observation, { co2: 5.8, radiationRate: 0.72 });
  if (mode === "FATIGUE") Object.assign(observation, { sleep: 4.2, reaction: 505, fatigue: 5 });
  return observation;
};

export const createClinicalStore = () => {
  const observations = [];
  for (const crew of crewSeed) for (let i = 0; i < 12; i += 1) observations.push(makeObservation(crew, i));
  return {
    crew: structuredClone(crewSeed),
    observations,
    incidents: [],
    simulation: { mode: "NOMINAL", changedAt: new Date().toISOString() }
  };
};

export const appendObservation = (store, observation) => {
  store.observations.push(observation);
  const crewObservations = store.observations.filter((item) => item.crewId === observation.crewId);
  if (crewObservations.length > 120) store.observations = store.observations.filter((item) => item.id !== crewObservations[0].id);
};

export const observationForMode = (crew, mode) => makeObservation(crew, Math.floor(Date.now() / 4000), mode);

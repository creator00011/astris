const NEOWS_URL = "https://api.nasa.gov/neo/rest/v1/feed";

export const createNasaNeowsService = () => {
  let context = null;
  let status = { source: "UNAVAILABLE", checkedAt: null, message: "NASA NeoWs data has not been requested yet." };

  const refresh = async () => {
    const end = new Date();
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    const formatDate = (date) => date.toISOString().slice(0, 10);
    const url = `${NEOWS_URL}?start_date=${formatDate(start)}&end_date=${formatDate(end)}&api_key=${process.env.NASA_API_KEY || "DEMO_KEY"}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`NASA NeoWs returned HTTP ${response.status}`);
      const payload = await response.json();
      const objects = Object.values(payload.near_earth_objects || {}).flat();
      if (!objects.length) throw new Error("NASA NeoWs returned no near-Earth objects");
      const approaches = objects.flatMap((object) => (object.close_approach_data || []).map((approach) => ({
        name: object.name,
        nasaJplUrl: object.nasa_jpl_url,
        hazardous: object.is_potentially_hazardous_asteroid,
        date: approach.close_approach_date,
        missDistanceKm: Number(approach.miss_distance?.kilometers || 0),
        relativeVelocityKph: Number(approach.relative_velocity?.kilometers_per_hour || 0)
      }))).sort((a, b) => a.missDistanceKm - b.missDistanceKm);
      const nearest = approaches[0];
      context = {
        windowStart: formatDate(start),
        windowEnd: formatDate(end),
        objectCount: new Set(objects.map((object) => object.id)).size,
        hazardousCount: objects.filter((object) => object.is_potentially_hazardous_asteroid).length,
        nearestApproach: nearest
      };
      status = { source: "NASA_NEOWS", checkedAt: new Date().toISOString(), message: "Near-Earth-object mission context loaded from NASA NeoWs." };
    } catch (error) {
      status = {
        source: context ? "NASA_NEOWS_CACHE" : "UNAVAILABLE",
        checkedAt: new Date().toISOString(),
        message: context ? "NASA NeoWs unavailable; showing the last cached NASA context." : `NASA NeoWs unavailable. ${error.message}`
      };
    }
    return context;
  };

  return { refresh, getContext: () => context, getStatus: () => status };
};

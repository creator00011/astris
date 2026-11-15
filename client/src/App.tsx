import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Check, ClipboardList, HeartPulse, History, ShieldCheck, Siren, UserRound } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const API = "http://localhost:5001/api/clinical";
type Incident = { id: string; type: string; title: string; protocol: string; severity: "HIGH" | "MODERATE"; status: "OPEN" | "ACKNOWLEDGED" | "RECOVERED"; observationCount: number };
type CaseFile = {
  crew: { id: string; name: string; role: string; missionDay: number; radiationMSv: number };
  readiness: { score: number; label: string };
  latest: { pulse: number; oxygen: number; co2: number; sleep: number; reaction: number; fatigue: number };
  observations: Array<{ recordedAt: string; pulse: number; oxygen: number; co2: number; reaction: number }>;
  incidents: Incident[];
  missionContext: {
    nasa: { source: string; message: string };
    nearEarthObjects: { objectCount: number; hazardousCount: number; nearestApproach: { name: string; date: string; missDistanceKm: number } | null } | null;
  };
};
const statusColor = (status: string) => status === "OPEN" ? "text-rose-300 border-rose-500/60 bg-rose-500/10" : status === "ACKNOWLEDGED" ? "text-amber-300 border-amber-500/60 bg-amber-500/10" : "text-emerald-300 border-emerald-500/60 bg-emerald-500/10";

export default function App() {
  const [crewId, setCrewId] = useState("ASTRO-01");
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [scenario, setScenario] = useState("NOMINAL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCaseFile = useCallback(async () => {
    try {
      const response = await fetch(`${API}/crew/${crewId}/case-file`);
      if (!response.ok) throw new Error("Case file unavailable");
      setCaseFile(await response.json() as CaseFile);
      setError("");
    } catch {
      setError("Clinical console server is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  useEffect(() => {
    void loadCaseFile();
    const timer = window.setInterval(loadCaseFile, 4000);
    return () => window.clearInterval(timer);
  }, [loadCaseFile]);

  const setSimulation = async (mode: string) => {
    const response = await fetch(`${API}/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode })
    });
    if (response.ok) {
      setScenario(mode);
      setMessage(`${mode} clinical scenario activated.`);
    } else {
      setError("Scenario could not be activated.");
    }
  };

  const updateIncident = async (id: string, action: "acknowledge" | "recover") => {
    const response = await fetch(`${API}/incidents/${id}/${action}`, { method: "POST" });
    if (response.ok) {
      setMessage(`Incident ${action}d.`);
      await loadCaseFile();
    } else {
      setError("Incident update failed.");
    }
  };

  const chartData = useMemo(() => caseFile?.observations.map((observation) => ({
    ...observation,
    time: new Date(observation.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  })) || [], [caseFile]);
  const nearest = caseFile?.missionContext.nearEarthObjects?.nearestApproach;

  return (
    <main className="min-h-screen bg-[#07111f] p-4 text-slate-100 md:p-8">
      <header className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-5 border-b border-sky-900/60 pb-6">
        <div>
          <div className="clinical-label mb-2">Aerospace Clinical Operations // Variant 02</div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">ASTRIS <span className="text-sky-400">Clinical Console</span></h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">A case-file workflow for observing, acknowledging, and recovering crew health incidents.</p>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">NASA MISSION CONTEXT: {caseFile?.missionContext.nasa.source || "LOADING"}</div>
        </div>
        <div className="flex items-center gap-3">
          <label className="clinical-label">Patient file
            <select value={crewId} onChange={(event) => setCrewId(event.target.value)} className="ml-2 rounded-lg border border-sky-800 bg-slate-900 p-2 text-sm normal-case tracking-normal text-white">
              <option>ASTRO-01</option><option>ASTRO-02</option>
            </select>
          </label>
          <div className={`rounded-xl border px-4 py-3 text-center ${caseFile?.readiness.label === "READY" ? "border-emerald-500/60 bg-emerald-500/10" : "border-amber-500/60 bg-amber-500/10"}`}>
            <div className="clinical-label">Readiness</div><strong>{caseFile?.readiness.score ?? "--"}%</strong>
          </div>
        </div>
      </header>

      {loading && <div className="mx-auto mt-5 max-w-7xl rounded-xl border border-sky-500/40 bg-sky-500/10 p-3 text-sm text-sky-200">Loading clinical case file...</div>}
      {error && <div className="mx-auto mt-5 max-w-7xl rounded-xl border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-200">{error} <button className="ml-3 underline" onClick={loadCaseFile}>Retry</button></div>}
      {message && <div className="mx-auto mt-5 max-w-7xl rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</div>}

      <div className="mx-auto mt-6 grid max-w-7xl gap-5 lg:grid-cols-[230px_1fr]">
        <aside className="panel h-fit p-4">
          <div className="mb-5 flex items-center gap-3"><div className="rounded-full bg-sky-500/20 p-3 text-sky-300"><UserRound size={20}/></div><div><strong>{caseFile?.crew.name || "Loading"}</strong><div className="text-xs text-slate-500">{caseFile?.crew.role}</div></div></div>
          <nav className="space-y-2 text-sm"><div className="rounded-lg bg-sky-500/15 p-3 text-sky-200"><ClipboardList size={16} className="mr-2 inline"/>Case overview</div><div className="p-3 text-slate-400"><History size={16} className="mr-2 inline"/>Incident history</div><div className="p-3 text-slate-400"><ShieldCheck size={16} className="mr-2 inline"/>Recovery plan</div></nav>
          <div className="mt-8 border-t border-slate-700 pt-4 text-xs text-slate-500">Mission day {caseFile?.crew.missionDay}<br/>Radiation dose {caseFile?.crew.radiationMSv.toFixed(1)} mSv</div>
        </aside>

        <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Pulse", `${caseFile?.latest.pulse ?? "--"} bpm`, HeartPulse],
              ["Oxygen", `${caseFile?.latest.oxygen ?? "--"}%`, Activity],
              ["Cabin CO2", `${caseFile?.latest.co2 ?? "--"} mmHg`, Siren],
              ["Reaction", `${caseFile?.latest.reaction ?? "--"} ms`, Check]
            ].map(([label, value, Icon]) => <div className="panel p-4" key={label as string}><div className="clinical-label mb-3">{label as string}</div><div className="flex items-center justify-between"><strong className="text-2xl">{value as string}</strong><span className="rounded-lg bg-sky-500/10 p-2 text-sky-300"><Icon size={18}/></span></div></div>)}
            <div className="panel p-4"><div className="clinical-label mb-3">NEO Window</div><strong className="text-2xl">{caseFile?.missionContext.nearEarthObjects?.objectCount ?? "--"}</strong><div className="mt-1 text-xs text-slate-500">{caseFile?.missionContext.nearEarthObjects ? `${caseFile.missionContext.nearEarthObjects.hazardousCount} flagged` : "NASA loading"}</div></div>
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><div className="clinical-label">Observation stream</div><h2 className="text-lg font-semibold">Physiological trend review</h2></div><div className="flex gap-2">{[["NOMINAL", "Nominal"], ["CARDIO", "Cardio"], ["ENVIRONMENT", "Environment"], ["FATIGUE", "Fatigue"]].map(([value, label]) => <button key={value} onClick={() => void setSimulation(value)} className={`rounded-lg px-3 py-2 text-xs ${scenario === value ? "bg-sky-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>{label}</button>)}</div></div>
            <ResponsiveContainer width="100%" height={220}><AreaChart data={chartData}><defs><linearGradient id="pulseFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity=".4"/><stop offset="100%" stopColor="#38bdf8" stopOpacity="0"/></linearGradient></defs><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{ background: "#0c1a2b", border: "1px solid #1d3854" }}/><Area type="monotone" dataKey="pulse" stroke="#38bdf8" fill="url(#pulseFill)"/></AreaChart></ResponsiveContainer>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <div className="panel p-5">
              <div className="mb-4 flex items-center justify-between"><div><div className="clinical-label">Active worklist</div><h2 className="text-lg font-semibold">Clinical incidents</h2></div><span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{caseFile?.incidents.filter((item) => item.status !== "RECOVERED").length || 0} active</span></div>
              {caseFile?.incidents.length ? caseFile.incidents.map((incident) => <div className={`mb-3 rounded-xl border p-4 ${statusColor(incident.status)}`} key={incident.id}><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold tracking-widest">{incident.severity} // {incident.type}</div><h3 className="mt-1 font-semibold">{incident.title}</h3><p className="mt-2 text-sm opacity-80">{incident.protocol}</p><p className="mt-2 text-xs opacity-70">Correlated observations: {incident.observationCount}</p></div><span className="rounded-full border px-2 py-1 text-xs">{incident.status}</span></div><div className="mt-4 flex gap-2">{incident.status === "OPEN" && <button onClick={() => void updateIncident(incident.id, "acknowledge")} className="rounded-lg bg-amber-500/20 px-3 py-2 text-xs">Acknowledge</button>}{incident.status !== "RECOVERED" && <button onClick={() => void updateIncident(incident.id, "recover")} className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs">Mark recovered</button>}</div></div>) : <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">No incidents in the clinical worklist.</div>}
            </div>

            <div className="space-y-5">
              <div className="panel p-5"><div className="clinical-label">Care pathway</div><h2 className="mb-4 text-lg font-semibold">Readiness factors</h2><div className="space-y-4 text-sm"><div><div className="mb-1 flex justify-between"><span>Recovery readiness</span><strong className="text-sky-300">{caseFile?.readiness.score ?? "--"}%</strong></div><div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-sky-400" style={{ width: `${caseFile?.readiness.score || 0}%` }}/></div></div><div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-slate-400">Sleep reserve</span><span>{caseFile?.latest.sleep ?? "--"} hours</span></div><div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-slate-400">Fatigue rating</span><span>{caseFile?.latest.fatigue ?? "--"} / 5</span></div><div className="flex justify-between"><span className="text-slate-400">Workflow state</span><span className="text-sky-300">{caseFile?.readiness.label}</span></div></div></div>
              <div className="panel p-5"><div className="clinical-label">NASA NeoWs</div><h2 className="mb-2 text-lg font-semibold">Near-Earth mission context</h2><p className="text-xs text-slate-400">{caseFile?.missionContext.nasa.message}</p>{nearest && <div className="mt-3 rounded-lg bg-slate-900 p-3 text-xs"><div className="font-semibold text-sky-300">{nearest.name}</div><div className="mt-1 text-slate-400">Closest approach: {nearest.missDistanceKm.toLocaleString()} km</div><div className="mt-1 text-slate-400">Date: {nearest.date}</div></div>}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

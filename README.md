# ASTRIS Clinical Console Variant


- `server`: Express clinical case-file API on port `5001`
- `client`: React clinical console on port `5174`
- No database; state is held in memory
- Different business logic: incidents are correlated over repeated observations and move through `OPEN`, `ACKNOWLEDGED`, and `RECOVERED` states
- NASA data source: NASA NeoWs near-Earth-object feed, used as mission-context data in the clinical console

## Run

```powershell
npm run install:all
npm start
```

In another PowerShell window:

```powershell
npm run dev --prefix client2
```

## Test

```powershell
npm test --prefix server2
npm run build --prefix client2
```

NASA NeoWs:

- API: `https://api.nasa.gov/neo/rest/v1/feed`
- Documentation: `https://api.nasa.gov/`
- The console displays the seven-day near-Earth-object count, potentially hazardous-object count, and nearest recorded approach.

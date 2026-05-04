# BggGrids

A board-game "About Me" grid builder powered by **BoardGameGeek XML API2**.  
Inspired by [grids.fun](https://grids.fun/t/about-me-video-games-dcefq) — adapted for board games.

## Features

| Feature | Detail |
|---|---|
| 4 × 5 grid | 20 cells, each with an editable label |
| BGG search | Real-time game search via BGG XML API2 |
| Collection loader | Enter any BGG username to browse their owned games |
| Editable texts | Title + every cell label are click-to-edit |
| Default labels | Stored in `ClientApp/src/defaults.json` |
| Download PNG | Exports the entire grid as a 2× PNG via html2canvas |

## Running

### Development (two terminals)

**Terminal 1 — .NET backend (BGG proxy)**
```bash
cd BggGrids
dotnet run
# → http://localhost:5000
```

**Terminal 2 — React dev server**
```bash
cd BggGrids/ClientApp
npm install   # first time only
npm run dev
# → http://localhost:5173  (proxies /api/* to :5000)
```

Open **http://localhost:5173** in your browser.

### Production

```bash
cd BggGrids/ClientApp
npm run build          # outputs to ClientApp/dist/

cd ..
dotnet run             # serves SPA from ClientApp/dist/ + /api/* proxy
# → http://localhost:5000
```

## Changing default labels

Edit **`ClientApp/src/defaults.json`** — the `"cells"` array maps each grid position  
(0 = top-left, reading left-to-right) to a default label.  
Run `npm run build` after changing defaults.

## Architecture

```
BggGrids/
├── Program.cs            # Minimal ASP.NET — BGG proxy endpoints + static file serving
├── BggGrids.csproj       # SDK.Web, net10.0
├── Properties/
│   └── launchSettings.json
└── ClientApp/            # Vite + React SPA
    ├── src/
    │   ├── App.jsx             # Root component + state
    │   ├── App.css             # Dark theme
    │   ├── defaults.json       # Default title & cell labels
    │   ├── components/
    │   │   ├── Grid.jsx        # 4×5 grid (forwarded ref for html2canvas)
    │   │   ├── GridCell.jsx    # Individual cell (thumbnail + editable label)
    │   │   └── SearchPanel.jsx # Search / Collection tabs
    │   └── utils/
    │       └── bggApi.js       # BGG search, thing, collection helpers
    └── dist/               # Production build output
```

## BGG API endpoints used

| Endpoint | Used for |
|---|---|
| `/xmlapi2/search?query=…&type=boardgame` | Name search |
| `/xmlapi2/thing?id=…&type=boardgame` | Batch thumbnail fetch |
| `/xmlapi2/collection?username=…&own=1` | User collection |

All calls go through the .NET proxy at `/api/bgg/*` to work around browser CORS restrictions.  
Thumbnail images are also proxied through `/api/bgg/image?url=…` so html2canvas can capture them.

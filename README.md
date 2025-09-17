# JSON Diff Manager

En React + TypeScript + Vite-applikation för hantering av JSON-skillnader mellan templates och kunddata.

## Funktioner

- **Autentisering**: Mock-autentisering med roller (Admin/Kund) - förbered för Entra ID
- **Admin Panel**: Kollapsbar sidebar, kundväljare, JSON-jämförelse
- **Kund-vy**: Förenklad vy för kundanvändare
- **JSON Split View**: Visuell jämförelse med diff-markering
- **Beslutsbuffering**: Samla beslut och skicka i batch till backend

## Teknikstack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Lucide React
- **State**: React hooks, Context API
- **Routing**: React Router 6 med skyddade routes

## Installation

```bash
# Klona repot
git clone <GIT_URL>
cd json-diff-manager

# Installera dependencies
npm install

# Starta dev-server
npm run dev
```

## Konfiguration

Skapa en `.env` fil i root:

```bash
VITE_API_BASE_URL=http://localhost:7134
VITE_ENV=development
```

## Backend API

Applikationen förväntar sig dessa endpoints:

### POST /compare/check
```json
{
  "customerId": "volvo"
}
```

### POST /compare/apply
```json
{
  "customerId": "volvo", 
  "decisions": [
    {"path": "/user/id", "action": "applyTemplate"},
    {"path": "/user/age", "action": "keepCustomer"}
  ]
}
```

## Utveckling

- **Mock-data**: Används när backend inte är tillgänglig
- **TODO**: Entra ID-integration markerad i koden
- **Design system**: Färger och styles definierade i `src/index.css`

## Roller

- **Admin**: Tillgång till admin panel med alla kunder
- **Kund**: Tillgång till egen data-vy

## Diff-typer

- `typeMismatch` - Olika datatyper (röd)
- `valueMismatch` - Olika värden (gul)  
- `missing` - Saknad property (blå)
- `unexpected` - Oväntad property (lila)
- `lengthMismatch` - Array-längdskillnad (orange)
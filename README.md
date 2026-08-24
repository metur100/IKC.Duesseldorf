# IKC Düsseldorf — Web stranica

Moderna verzija web stranice **IGBD - Gemeinde IKC Düsseldorf e.V.**
Napravljeno sa React + TypeScript + Vite. Dvojezično: **bosanski (BS)** i **njemački (DE)**.

## Pokretanje (development)

```bash
npm install
npm run dev
```

Otvorite adresu koju ispiše terminal (obično http://localhost:5173).

## Build za produkciju

```bash
npm run build
npm run preview
```

## Vaktija API (bez iframe)

App koristi `Vaktija.eu` kao primarni izvor vremena za namaz preko proxy endpointa:

- Lokalno (`npm run dev`): `GET /api/vaktija/dusseldorf` (Vite middleware)
- Produkcija (serverless): `api/vaktija/dusseldorf.ts`

Frontend prvo pokušava Vaktija proxy, a ako endpoint nije dostupan automatski pada na AlAdhan fallback.

Opcionalno možete postaviti vlastiti URL:

```bash
VITE_VAKTIJA_PROXY_URL=https://vas-domen.com/api/vaktija/dusseldorf
```

## Struktura

- `src/i18n/` — svi prijevodi (BS/DE) i sav tekstualni sadržaj sajta
- `src/context/` — prebacivanje jezika
- `src/components/` — Navbar, Footer, PrayerBanner
- `src/pages/` — sve stranice (Početna, O nama, Aktivnosti, FAQ, Članarina, Kontakt/Impressum...)

Sve informacije su preuzete sa originalne stranice ikc-d.org i sačuvane.

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

## Backend (backend/IKC.Api)

ASP.NET Core (.NET 10) API na MonsterASP (https://ikcduesseldorf.runasp.net):

- `GET /api/vaktija/dusseldorf?lang=bs|de`: vremena namaza sa **vaktija.eu** (keširano do ponoći; ako vaktija.eu padne, vremena dolaze iz keširanog mjeseca)
- `GET /api/content`: sav sadržaj stranice (isti oblik kao `src/i18n/content.json`)
- `POST /api/auth/login`: prijava admina (JWT)
- `/api/admin/content/{lang}/{key}` (GET/PUT), `/api/admin/images` (upload na ImgBB), `/api/admin/users`: za admin panel

Kad admin sačuva izmjenu, backend pokreće GitHub Actions (`repository_dispatch: content-updated`), workflow
preuzme sadržaj sa API-ja (`scripts/fetch-content.mjs`) i ponovo objavi statičnu stranicu.

Lokalno:

```bash
cd backend/IKC.Api
dotnet user-secrets set "Jwt:Key" "<najmanje 32 znaka>"
dotnet user-secrets set "ImgBb:ApiKey" "<ključ>"
dotnet user-secrets set "Admin:Password" "<lozinka za prvog admina>"
dotnet run            # http://localhost:5013, SQLite baza ikc-dev.db
```

`npm run dev` prosljeđuje `/api` na `http://localhost:5013`.

Produkcija: tajne su u `backend/IKC.Api/appsettings.Production.json` (nije u gitu). Za automatsku objavu poslije izmjene
treba u njega dodati `"GitHub": { "Token": "..." }` (fine-grained token za ovaj repo, dozvola *Contents: read and write*).

## Struktura

- `src/i18n/` — svi prijevodi (BS/DE) i sav tekstualni sadržaj sajta
- `src/context/` — prebacivanje jezika
- `src/components/` — Navbar, Footer, PrayerBanner
- `src/pages/` — sve stranice (Početna, O nama, Aktivnosti, FAQ, Članarina, Kontakt/Impressum...)

Sve informacije su preuzete sa originalne stranice ikc-d.org i sačuvane.

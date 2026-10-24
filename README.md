# IKC Düsseldorf — web stranica, admin (CMS) i aplikacija

Web stranica **IGBD – Gemeinde IKC Düsseldorf e.V.**, dvojezično (bosanski / njemački).

- `src/` — web stranica (React + TypeScript + Vite), objavljena na GitHub Pages
- `src/admin/` — admin panel (CMS) na `/admin`
- `backend/IKC.Api/` — ASP.NET Core API na MonsterASP (https://ikcduesseldorf.runasp.net)
- `mobile/` — iOS/Android aplikacija (Expo), vidi `mobile/README.md`
- `brand/` — logo i ikonice (izvor: `brand/mark.mjs`, generisanje: `brand/gen.mjs`)

## Kako radi sadržaj

Svaka stranica je lista **blokova** (tekst, slika i tekst, galerija, kartice, lista, FAQ, osobe, hronologija,
vaktija, obrazac za članstvo, mapa…). Model je u `src/cms/types.ts`. Admini u `/admin`:

- uređuju stranice blok po blok (dodavanje, prevlačenje, dupliranje, sakrivanje), uz pregled uživo (računar/mobitel)
- prave nove stranice (prvo kao nacrt), mijenjaju adresu, opis za Google i zaglavlje
- uređuju meni, footer, kontakt, vrijeme džume i obavještenje na vrhu stranice
- učitavaju slike (ImgBB), pregledaju online prijave za članstvo (izvoz u Excel/CSV), upravljaju adminima
- vraćaju ranije verzije stranice (zadnjih 30) i obrisane stranice

Sačuvana izmjena je **odmah vidljiva** na stranici i u aplikaciji (sadržaj se učitava sa `GET /api/site`).
`src/cms/site.json` je rezerva/početni sadržaj; GitHub Actions ga prije svakog builda osvježi sa API-ja
(`scripts/fetch-content.mjs`), da Google dobije aktuelne naslove i opise.

## Vaktija

Backend jednom dnevno preuzme vaktiju za cijeli mjesec sa vaktija.eu i sačuva je u bazu
(`GET /api/vaktija/dusseldorf`). Stranica i aplikacija same računaju sljedeći namaz i odbrojavanje (po berlinskom vremenu).
Ako vaktija.eu ne odgovori, koristi se ranije sačuvani mjesec.

## Pokretanje (development)

```bash
npm install
npm run dev          # http://localhost:5173, /api ide na localhost:5013

cd backend/IKC.Api
dotnet user-secrets set "Jwt:Key" "<najmanje 32 znaka>"
dotnet user-secrets set "ImgBb:ApiKey" "<ključ>"
dotnet user-secrets set "Admin:Password" "<lozinka za prvog admina>"
dotnet run           # http://localhost:5013, SQLite baza ikc-dev.db (puni se iz src/cms/site.json)
```

## Backend API

- `GET /api/site` — postavke i objavljene stranice
- `GET /api/vaktija/dusseldorf` — danas, sutra i cijeli mjesec
- `POST /api/membership` — online prijava za članstvo
- `POST /api/auth/login` — prijava admina (JWT)
- `/api/admin/...` — stranice, postavke, revizije, slike, prijave, admini

Produkcija: tajne su u `backend/IKC.Api/appsettings.Production.json` (nije u gitu). Nove tabele se prave same pri
pokretanju (`DbSeeder.EnsureTablesAsync`). Deploy: `dotnet publish -c Release` pa Web Deploy na MonsterASP.
Za automatski novi build stranice poslije izmjene (samo za SEO) dodati `"GitHub": { "Token": "..." }`.

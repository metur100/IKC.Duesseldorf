# IKC Düsseldorf – mobilna aplikacija (iOS / Android)

Expo (React Native, TypeScript, expo-router). Jezik: bosanski (zadano) i njemački, mijenja se u tabu **Više**.

## Struktura

| Tab | Sadržaj |
| --- | --- |
| **Početna** | Stranica `home` iz CMS-a (hero sa karticom sljedećeg namaza, svi blokovi) |
| **Vaktija** | Današnja vremena, odbrojavanje do sljedećeg vakta, datum (gregorijanski + hidžretski), džuma, tabela za mjesec |
| **Džemat** | Meni iz `settings.nav` → svaka stranica se otvara nativno |
| **Više** | Jezik, kontakt (poziv / e-mail / mape), Impressum / Datenschutz, verzija, **Administracija** (web CMS u WebView-u) |

- `src/app/` – ekrani (expo-router), `src/components/blocks/` – nativni prikaz svih CMS blokova,
  `src/components/RichText.tsx` – prikaz formatiranog teksta (ProseMirror JSON), `src/lib/` – API, keš, vaktija, jezik.
- `src/cms/types.ts` i `src/cms/site.json` su **kopije** iz `../src/cms/` (ne mijenjati ručno).

## Razvoj

```bash
cd mobile
npm install
npm run sync-content      # kopira ../src/cms/types.ts i ../src/cms/site.json
npx expo start            # pa "a" za Android emulator / "i" za iOS simulator (Expo Go radi)
npx tsc --noEmit          # provjera tipova
npx expo-doctor           # provjera zavisnosti
```

## Kako se ažurira sadržaj (bez nove verzije aplikacije)

Sav sadržaj (stranice, meni, kontakt, džuma, obavještenje) dolazi iz CMS-a:
`GET https://ikcduesseldorf.runasp.net/api/site`. Promjene u admin panelu
(`https://metur100.github.io/IKC.Duesseldorf/admin` ili u aplikaciji: **Više → Administracija**)
vidljive su u aplikaciji odmah nakon povlačenja prema dolje (pull-to-refresh) ili pri sljedećem otvaranju.

- Aplikacija pamti zadnji preuzeti sadržaj (radi i bez interneta).
- Ako server nije dostupan pri prvom pokretanju, prikazuje se sadržaj ugrađen u aplikaciju (`src/cms/site.json`).
  Prije svakog builda pokrenite `npm run sync-content` da ugrađeni sadržaj bude svjež (skripte `build:*` to rade same).
- Vaktija: `GET /api/vaktija/dusseldorf`, sačuvana lokalno; odbrojavanje se računa na uređaju po berlinskom vremenu.
- Novi **tip bloka** ili promjena modela (`types.ts`) zahtijevaju novu verziju aplikacije.

## Build i objava (EAS)

Prijava: `eas whoami` (račun mora imati pristup organizaciji **certi-development**).
Verzije (build number / versionCode) vodi EAS (`appVersionSource: remote`, `autoIncrement`) – ne treba ih ručno mijenjati.

### Android

```bash
cd mobile
npm run sync-content
eas build -p android --profile production        # AAB za Google Play
eas build -p android --profile production-apk    # APK za direktnu instalaciju
eas build -p android --profile preview           # interni test APK
```

Objava na Google Play (prvi put se AAB mora ručno uploadati u Play Console, nakon toga):

1. U Google Cloud / Play Console napravite *service account* sa pristupom aplikaciji i preuzmite JSON ključ.
2. Sačuvajte ga kao `mobile/google-service-account.json` (git ga ignoriše) – ili ga uploadujte u EAS (`eas credentials`).
3. `eas submit -p android --profile production --latest`
   (u `eas.json` je postavljeno `track: internal`, `releaseStatus: draft` – promijenite po potrebi).

### iOS

```bash
cd mobile
npm run sync-content
eas build -p ios --profile production     # interaktivno: prijava Apple ID-om, EAS pravi certifikate i profile
eas submit -p ios --profile production --latest
```

Prije `eas submit` upišite u `eas.json` → `submit.production.ios`: `appleId` (e-mail Apple ID-a),
`ascAppId` (App Store Connect → App → App Information → Apple ID) i `appleTeamId`.
Aplikaciju (bundle ID `com.certidevelopment.ikcd`) treba prvo napraviti u App Store Connect
(ili pustiti `eas submit` da je napravi). Nakon obrade build se pojavljuje u TestFlightu.

### Nova verzija aplikacije

1. Povećajte `expo.version` u `app.json` (npr. `1.0.0` → `1.1.0`) – to je verzija koju korisnici vide.
2. `npm run sync-content`
3. `eas build -p all --profile production` (build broj se povećava automatski)
4. `eas submit -p android --latest` i `eas submit -p ios --latest`

Male JS promjene bez novih nativnih paketa mogu se kasnije slati i preko EAS Update (`expo-updates`) – trenutno nije uključeno.

## Potpisivanje (Android)

Upload keystore za Android je napravio i čuva EAS (Expo serveri, "Build Credentials GjJ3KEBJ53 (default)").
Backup / pregled: `eas credentials -p android` → *production* → *Download existing keystore*.
**Bez tog keystora nije moguće objaviti ažuriranje na Google Play – preporučuje se backup na sigurnom mjestu.**
(Uz Google Play App Signing, Google drži ključ za potpisivanje aplikacije, a ovo je samo *upload* ključ.)

## Napomene

- EAS pakuje projekat preko gita. Dok `mobile/` nije commitan, pokrenite build sa `EAS_NO_VCS=1`
  (PowerShell: `$env:EAS_NO_VCS=1; eas build ...`). `.easignore` određuje šta se tada ne šalje.
- Backend: aplikacija koristi `GET /api/site`, `GET /api/vaktija/dusseldorf` (sa `today`, `tomorrow`, `month`,
  `gregorian`/`hijri` po jeziku) i `POST /api/membership`.

## Admin

**Više → Administracija** otvara web CMS (`{SITE}/admin`) u WebView-u. Prijava ostaje sačuvana
(localStorage WebView-a) između pokretanja. Android dugme "nazad" ide nazad u WebView-u, pa zatvara ekran.

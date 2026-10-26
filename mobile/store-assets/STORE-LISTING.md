# IKC Düsseldorf – Store listing kit

Everything to paste into **App Store Connect** and **Google Play Console**.
Store texts are in German (primary listing language – neither store offers Bosnian as a listing language),
with a Bosnian paragraph inside the description so the community feels at home.

Screenshots are in `de/` (German UI) and `bs/` (Bosnian UI). Use `de/` for the German listing.

| Folder | Size | Where to upload |
|---|---|---|
| `*/ios-iphone-6.9/` | 1320 × 2868 | App Store → iPhone 6,9" (required; Apple scales it down for smaller iPhones) |
| `*/ios-iphone-6.3/` | 1206 × 2622 | App Store → iPhone 6,3" (optional if 6,9" is uploaded) |
| `*/ios-ipad-13/` | 2064 × 2752 | App Store → iPad 13" (required, because the app supports iPad) |
| `*/android-phone/` | 1080 × 1920 | Play → Phone screenshots |
| `*/android-tablet/` | 1440 × 2560 | Play → 7-inch **and** 10-inch tablet screenshots (same files for both) |
| `*/play-feature-graphic-1024x500.png` | 1024 × 500 | Play → Feature graphic (Funktionsgrafik) |
| `play-icon-512.png` | 512 × 512 | Play → App icon |

---

## 1. Shared facts

| Field | Value |
|---|---|
| App name | IKC Düsseldorf |
| Bundle ID / package | com.certidevelopment.ikcd |
| Version | 1.0.0 |
| Developer / organisation | IGBD – Gemeinde IKC Düsseldorf e.V. |
| Address | Niederstraße 1, 40223 Düsseldorf, Deutschland |
| Contact e-mail | ikcduesseldorf@outlook.de |
| Phone | +49 211 930 46 19 |
| Website / marketing URL | https://metur100.github.io/IKC.Duesseldorf/ |
| Support URL | https://metur100.github.io/IKC.Duesseldorf/kontakt/ |
| Privacy policy URL | https://metur100.github.io/IKC.Duesseldorf/datenschutz/ |
| Impressum | https://metur100.github.io/IKC.Duesseldorf/impressum/ |
| Price | Free, no in-app purchases, no ads |
| Category | Lifestyle (secondary on iOS: Reference / Nachschlagewerke) |

---

## 2. Texts (German)

### App name (max. 30)
```
IKC Düsseldorf
```

### iOS subtitle (max. 30)
```
Gebetszeiten & Gemeinde
```

### Play short description (max. 80)
```
Gebetszeiten, Mekteb und Neuigkeiten der bosniakischen Gemeinde in Düsseldorf
```

### iOS promotional text (max. 170)
```
Gebetszeiten für Düsseldorf mit Countdown zum nächsten Gebet, Freitagsgebet um 13:00 Uhr und alles über das IKC Düsseldorf – auf Bosnisch und Deutsch.
```

### iOS keywords (max. 100, comma-separated, no spaces)
```
Vaktija,Namaz,Gebet,Moschee,Islam,Bosniaken,Bosnisch,Dzemat,Mekteb,IGBD,Ramadan,Freitagsgebet
```

### Description (iOS and Play, max. 4000)
```
Die offizielle App des Islamischen Kulturzentrums Düsseldorf (IGBD – Gemeinde IKC Düsseldorf e.V.), der bosniakischen Gemeinde in der Niederstraße 1 – seit 1983.

GEBETSZEITEN (VAKTIJA)
• Tägliche Gebetszeiten für Düsseldorf
• Countdown bis zum nächsten Gebet
• Gebetszeiten für den ganzen Monat
• Hinweis auf das Freitagsgebet (Džuma) um 13:00 Uhr

UNSERE GEMEINDE
• Über uns – die Geschichte der Gemeinde seit 1981
• Imam, Vorstand und Gremien
• Galerie mit Fotos unserer Räume

AKTIVITÄTEN
• Vorträge und Programm, Hutbas, Jugend- und Frauenprogramme
• Mekteb – Religionsunterricht für Kinder in 10 Gruppen, Koranlesen und Hifz
• Zusammenkünfte und Ramadanprogramm
• Dienste für Mitglieder: Trauungen, Beerdigungen, Seelsorge

MITGLIEDSCHAFT
• Mitglied werden – ganz einfach mit dem Online-Antrag
• Beitragsordnung, Satzung, Zahlungen und Spenden

KONTAKT
• Anrufen, E-Mail schreiben oder den Weg zur Moschee öffnen – mit einem Fingertipp

Die App ist zweisprachig: Bosnisch und Deutsch.
Keine Werbung, kein Tracking, keine Analyse-Tools.

—

Zvanična aplikacija Islamskog kulturnog centra Düsseldorf. Vaktija za Düsseldorf sa odbrojavanjem do sljedećeg namaza, mekteb, predavanja, galerija i online prijava za članstvo – na bosanskom i njemačkom jeziku.
```

### What's new / Neuigkeiten (version 1.0.0)
```
Erste Version der App des IKC Düsseldorf.
```

### Screenshot captions (already in the images – no field to fill)

---

## 2b. Texts (Croatian – hr)

See `STORE-LISTING-HR.md` (whole kit in Croatian, section 2b).

---

## 3. App Store Connect – step by step

**App Information**
- Primary language: Deutsch
- Category: Lifestyle · secondary: Nachschlagewerke (Reference)
- Content rights: "Does not contain, show or access third-party content" → **No**. The app shows prayer times from vaktija.eu and images hosted on ImgBB, but these are the community's own content/data used with permission. If unsure, answer **Yes** and confirm you have the rights.

**Pricing and Availability**
- Price: 0 € (Free) · Availability: all countries (or only Germany, Austria, Switzerland, Bosnia and Herzegovina)

**App Privacy (Datenschutz)**
- Privacy policy URL: see table above
- "Do you or your third-party partners collect data from this app?" → **Yes** (only through the membership form)
- Data types collected – for each: *Used for: App Functionality* · *Linked to the user: Yes* · *Used for tracking: No*
  - Contact info → **Name**, **Email address**, **Phone number**, **Physical address**
  - Financial info → **Other financial info** (IBAN for SEPA direct debit)
  - Other data → **Other data types** (birth date, place of birth, occupation, spouse/children names)
- No identifiers, no usage data, no diagnostics, no location.

**Age rating** → answer **None / No** to everything → result 4+.
(Unrestricted web access: **No** – the admin WebView only opens the community's own CMS.)

**App Review Information**
- Contact: your name, phone, e-mail
- Sign-in required: **No** for normal use.
- Notes (copy):
```
Die App ist ohne Anmeldung vollständig nutzbar. Der Bereich "Mehr → Administration" ist nur für Vorstandsmitglieder der Gemeinde zur Pflege der Inhalte gedacht und für normale Nutzer nicht relevant. Das Formular "Mitglied werden" sendet einen Mitgliedsantrag an den Server der Gemeinde (ikcduesseldorf.runasp.net). Gebetszeiten werden täglich vom Server der Gemeinde geladen.
```
- If Apple asks for an admin login, create a separate demo admin account in the CMS and give them those credentials.

**Export compliance**: already answered in the build (`ITSAppUsesNonExemptEncryption = false`) – nothing to fill.

**Build**: select the build you uploaded via `eas submit`.

---

## 4. Google Play Console – step by step

**Create app**: name *IKC Düsseldorf* · default language *Deutsch – de-DE* · App · Free.

**Main store listing**: texts from section 2, icon `play-icon-512.png`, feature graphic, phone + tablet screenshots.

**App content (Policy)**
- Privacy policy: URL above
- Ads: **No ads**
- App access: **All functionality is available without special access** (admin area is for staff – if you want, add the demo admin login under "Instructions")
- Content rating (IARC questionnaire): category **Reference, News, or Educational** → answer **No** to violence, sexuality, language, drugs, gambling; user interaction/sharing: **No**; shares location: **No** → expected rating: PEGI 3 / USK 0
- Target audience: **18+** (simplest; choosing ages under 13 triggers the Families policy). The app is also fine for kids, but 18+ avoids extra requirements.
- News app: **No**
- Data safety:
  - Collects data: **Yes** · Shares data with third parties: **No**
  - Encrypted in transit: **Yes** · Users can request deletion: **Yes** (by e-mail to ikcduesseldorf@outlook.de)
  - Personal info → Name, Email address, Phone number, Address, Other info (birth date, family) – *collected, not shared, required only when using the membership form, purpose: App functionality / Account management*
  - Financial info → Other financial info (IBAN) – same as above
- Government app: **No** · Financial features: **No** · Health: **No**

**Important – new personal developer accounts**: if the Play developer account is a *personal* account created after Nov 2023, Google requires a **closed test with at least 12 testers for 14 days** before you can publish to production. Organisation accounts are exempt.

---

## 5. Things to double-check before submitting
- Kontakt URL (`/kontakt/`) opens the right page.
- The phone number and e-mail in the listing are the ones you want public.
- Apple may question apps that are mostly website content (guideline 4.2). Our answer: native prayer times with countdown, monthly calendar, offline content, native membership form.

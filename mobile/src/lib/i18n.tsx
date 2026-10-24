import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Lang, LText } from '@/cms/types'

const STRINGS = {
  bs: {
    tabHome: 'Početna',
    tabVaktija: 'Vaktija',
    tabCommunity: 'Džemat',
    tabMore: 'Više',
    nextPrayer: 'Sljedeći vakat',
    inTime: 'za',
    current: 'Trenutno',
    today: 'Danas',
    month: 'Mjesec',
    day: 'Dan',
    jumuah: 'Džuma-namaz',
    staleNote: 'Prikazana su ranije preuzeta vremena.',
    vaktijaUnavailable: 'Vaktija trenutno nije dostupna. Povucite prema dolje za ponovni pokušaj.',
    loading: 'Učitavanje…',
    source: 'Izvor: vaktija.eu',
    monthTitle: 'Vaktija za mjesec',
    language: 'Jezik',
    contact: 'Kontakt',
    call: 'Pozovi',
    email: 'E-mail',
    address: 'Adresa',
    openMaps: 'Otvori u mapama',
    legal: 'Pravne informacije',
    admin: 'Administracija',
    adminHint: 'Uređivanje sadržaja (samo za administratore)',
    version: 'Verzija',
    back: 'Nazad',
    close: 'Zatvori',
    pageNotFound: 'Stranica nije pronađena.',
    toHome: 'Na početnu',
    offline: 'Nema veze sa serverom – prikazan je sačuvani sadržaj.',
    more: 'Više',
    of: 'od',
    previous: 'Prethodna',
    next: 'Sljedeća',
    communityIntro: 'Sve o našem džematu, aktivnostima i članstvu.',
    moreIntro: 'Postavke, kontakt i informacije o aplikaciji.',
    reload: 'Pokušaj ponovo',
    vaktijaIntro: 'Namaska vremena za Düsseldorf',
    // Članstvo
    f_personal: 'Lični podaci',
    f_firstName: 'Ime',
    f_lastName: 'Prezime',
    f_birthDate: 'Datum rođenja',
    f_birthPlace: 'Mjesto rođenja',
    f_job: 'Zanimanje',
    f_address: 'Adresa',
    f_street: 'Ulica',
    f_houseNumber: 'Broj',
    f_zip: 'Poštanski broj',
    f_city: 'Grad',
    f_contact: 'Kontakt',
    f_email: 'E-mail',
    f_phone: 'Mobitel',
    f_homePhone: 'Kućni telefon',
    f_family: 'Porodica',
    f_spouse: 'Ime i prezime supružnika',
    f_spouseBirthDate: 'Datum rođenja supružnika',
    f_spouseJob: 'Zanimanje supružnika',
    f_children: 'Djeca (ime i datum rođenja)',
    f_fee: 'Članarina',
    f_interval: 'Interval plaćanja',
    f_amount: 'Iznos',
    f_otherAmount: 'Drugi iznos',
    f_min: 'Najmanje',
    f_payMethod: 'Način plaćanja',
    f_sepa: 'SEPA mandat',
    f_accountHolder: 'Vlasnik računa',
    f_bank: 'Banka',
    f_iban: 'IBAN',
    f_bic: 'BIC',
    f_consents: 'Saglasnost',
    f_submit: 'Pošalji prijavu',
    f_sending: 'Šaljem…',
    f_required: 'Obavezno polje',
    f_invalidEmail: 'Neispravna e-mail adresa',
    f_invalidDate: 'Format: DD.MM.GGGG',
    f_invalidIban: 'Neispravan IBAN',
    f_invalidZip: 'Neispravan poštanski broj',
    f_minAmount: 'Najmanji iznos je',
    f_fixErrors: 'Molimo ispravite označena polja.',
    f_optional: 'opcionalno',
    f_successTitle: 'Hvala na prijavi!',
    f_successText: 'Vaša prijava je uspješno poslana. Javit ćemo vam se uskoro.',
    f_another: 'Nova prijava',
    f_error: 'Slanje nije uspjelo. Provjerite internet vezu i pokušajte ponovo.',
    f_datePh: 'DD.MM.GGGG',
  },
  de: {
    tabHome: 'Start',
    tabVaktija: 'Gebetszeiten',
    tabCommunity: 'Gemeinde',
    tabMore: 'Mehr',
    nextPrayer: 'Nächstes Gebet',
    inTime: 'in',
    current: 'Aktuell',
    today: 'Heute',
    month: 'Monat',
    day: 'Tag',
    jumuah: 'Freitagsgebet',
    staleNote: 'Es werden zuvor geladene Zeiten angezeigt.',
    vaktijaUnavailable: 'Gebetszeiten sind gerade nicht verfügbar. Zum Aktualisieren nach unten ziehen.',
    loading: 'Wird geladen…',
    source: 'Quelle: vaktija.eu',
    monthTitle: 'Gebetszeiten im Monat',
    language: 'Sprache',
    contact: 'Kontakt',
    call: 'Anrufen',
    email: 'E-Mail',
    address: 'Adresse',
    openMaps: 'In Karten öffnen',
    legal: 'Rechtliches',
    admin: 'Administration',
    adminHint: 'Inhalte bearbeiten (nur für Administratoren)',
    version: 'Version',
    back: 'Zurück',
    close: 'Schließen',
    pageNotFound: 'Seite nicht gefunden.',
    toHome: 'Zur Startseite',
    offline: 'Keine Verbindung zum Server – gespeicherte Inhalte werden angezeigt.',
    more: 'Mehr',
    of: 'von',
    previous: 'Zurück',
    next: 'Weiter',
    communityIntro: 'Alles über unsere Gemeinde, Aktivitäten und Mitgliedschaft.',
    moreIntro: 'Einstellungen, Kontakt und App-Informationen.',
    reload: 'Erneut versuchen',
    vaktijaIntro: 'Gebetszeiten für Düsseldorf',
    f_personal: 'Persönliche Daten',
    f_firstName: 'Vorname',
    f_lastName: 'Nachname',
    f_birthDate: 'Geburtsdatum',
    f_birthPlace: 'Geburtsort',
    f_job: 'Beruf',
    f_address: 'Anschrift',
    f_street: 'Straße',
    f_houseNumber: 'Nr.',
    f_zip: 'PLZ',
    f_city: 'Ort',
    f_contact: 'Kontakt',
    f_email: 'E-Mail',
    f_phone: 'Mobil',
    f_homePhone: 'Festnetz',
    f_family: 'Familie',
    f_spouse: 'Name des Ehepartners',
    f_spouseBirthDate: 'Geburtsdatum des Ehepartners',
    f_spouseJob: 'Beruf des Ehepartners',
    f_children: 'Kinder (Name und Geburtsdatum)',
    f_fee: 'Mitgliedsbeitrag',
    f_interval: 'Zahlungsintervall',
    f_amount: 'Betrag',
    f_otherAmount: 'Anderer Betrag',
    f_min: 'Mindestens',
    f_payMethod: 'Zahlungsart',
    f_sepa: 'SEPA-Lastschriftmandat',
    f_accountHolder: 'Kontoinhaber',
    f_bank: 'Bank',
    f_iban: 'IBAN',
    f_bic: 'BIC',
    f_consents: 'Einverständnis',
    f_submit: 'Antrag senden',
    f_sending: 'Wird gesendet…',
    f_required: 'Pflichtfeld',
    f_invalidEmail: 'Ungültige E-Mail-Adresse',
    f_invalidDate: 'Format: TT.MM.JJJJ',
    f_invalidIban: 'Ungültige IBAN',
    f_invalidZip: 'Ungültige PLZ',
    f_minAmount: 'Mindestbetrag ist',
    f_fixErrors: 'Bitte korrigieren Sie die markierten Felder.',
    f_optional: 'optional',
    f_successTitle: 'Vielen Dank für Ihren Antrag!',
    f_successText: 'Ihr Antrag wurde erfolgreich gesendet. Wir melden uns in Kürze.',
    f_another: 'Neuer Antrag',
    f_error: 'Senden fehlgeschlagen. Bitte Internetverbindung prüfen und erneut versuchen.',
    f_datePh: 'TT.MM.JJJJ',
  },
} as const

export type StringKey = keyof (typeof STRINGS)['bs']

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  /** UI tekst */
  t: (key: StringKey) => string
  /** Tekst iz CMS-a ({ bs, de }) s rezervom na drugi jezik */
  tx: (v: LText | undefined | null) => string
}

const Ctx = createContext<LangCtx | null>(null)
const KEY = 'ikcd:lang'

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('bs')

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'bs' || v === 'de') setLangState(v)
      })
      .catch(() => {})
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    AsyncStorage.setItem(KEY, l).catch(() => {})
  }, [])

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      setLang,
      t: (key) => STRINGS[lang][key] ?? STRINGS.bs[key],
      tx: (v) => {
        if (!v) return ''
        const s = v[lang]
        if (s && s.trim()) return s
        return v[lang === 'bs' ? 'de' : 'bs'] ?? ''
      },
    }),
    [lang, setLang],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLang outside LangProvider')
  return c
}

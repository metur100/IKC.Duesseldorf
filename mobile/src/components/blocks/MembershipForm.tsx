import Feather from '@expo/vector-icons/Feather'
import { ReactNode, useMemo, useRef, useState } from 'react'
import { KeyboardTypeOptions, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import { MEMBERSHIP_CONSENT, MEMBERSHIP_FEES, type Lang, type MembershipApplication } from '@/cms/types'
import { ApiError, fetchJson } from '@/lib/config'
import { useLang } from '@/lib/i18n'
import { colors, fonts, radius, space } from '@/lib/theme'
import { Btn, ToneProvider } from '../ui'

const PAY_METHODS: { id: 'sepa' | 'transfer' | 'cash'; label: Record<Lang, string>; hint: Record<Lang, string> }[] = [
  { id: 'sepa', label: { bs: 'SEPA direktno zaduženje', de: 'SEPA-Lastschrift' }, hint: { bs: 'Automatska naplata sa vašeg računa', de: 'Automatischer Einzug von Ihrem Konto' } },
  { id: 'transfer', label: { bs: 'Uplata na račun', de: 'Überweisung' }, hint: { bs: 'Sami uplaćujete na račun džemata', de: 'Sie überweisen selbst an die Gemeinde' } },
  { id: 'cash', label: { bs: 'Gotovina', de: 'Barzahlung' }, hint: { bs: 'Kod blagajnika u džematu', de: 'Beim Kassierer in der Gemeinde' } },
]

const INTERVALS: { id: 'monthly' | 'halfyear' | 'yearly'; label: Record<Lang, string>; per: Record<Lang, string> }[] = [
  { id: 'monthly', label: { bs: 'Mjesečno', de: 'Monatlich' }, per: { bs: 'mjesečno', de: 'monatlich' } },
  { id: 'halfyear', label: { bs: 'Polugodišnje', de: 'Halbjährlich' }, per: { bs: 'polugodišnje', de: 'halbjährlich' } },
  { id: 'yearly', label: { bs: 'Godišnje', de: 'Jährlich' }, per: { bs: 'godišnje', de: 'jährlich' } },
]

type Fields = Omit<MembershipApplication, 'amount' | 'consentData' | 'consentSepa' | 'lang'>
const EMPTY: Fields = {
  firstName: '',
  lastName: '',
  birthDate: '',
  birthPlace: '',
  job: '',
  street: '',
  houseNumber: '',
  zip: '',
  city: '',
  email: '',
  phone: '',
  homePhone: '',
  spouse: '',
  spouseBirthDate: '',
  spouseJob: '',
  children: '',
  payMethod: 'sepa',
  interval: 'monthly',
  accountHolder: '',
  bank: '',
  iban: '',
  bic: '',
}

/** "31.12.1980" -> "1980-12-31" (null ako nije ispravno) */
function parseDate(s: string): string | null {
  const m = /^\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s*$/.exec(s)
  if (!m) return null
  const d = +m[1]
  const mo = +m[2]
  const y = +m[3]
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  if (y < 1900 || dt.getTime() > Date.now()) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** IBAN provjera (mod 97) */
function validIban(raw: string): boolean {
  const iban = raw.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false
  const re = iban.slice(4) + iban.slice(0, 4)
  let rem = 0
  for (const ch of re) {
    const v = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55)
    for (const c of v) rem = (rem * 10 + +c) % 97
  }
  return rem === 1
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function MembershipForm() {
  const { lang, t } = useLang()
  const [f, setF] = useState<Fields>(EMPTY)
  const [amountChoice, setAmountChoice] = useState<number | 'other'>(MEMBERSHIP_FEES.monthly.options[0])
  const [otherAmount, setOtherAmount] = useState('')
  const [consentData, setConsentData] = useState(false)
  const [consentSepa, setConsentSepa] = useState(false)
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const fee = MEMBERSHIP_FEES[f.interval] ?? MEMBERSHIP_FEES.monthly
  const sepa = f.payMethod === 'sepa'
  const amount = amountChoice === 'other' ? Number(otherAmount.replace(',', '.')) : amountChoice

  const set = (k: keyof Fields) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const errors = useMemo(() => {
    const e: Partial<Record<keyof Fields | 'amount' | 'consentData' | 'consentSepa', string>> = {}
    const req = (k: keyof Fields) => {
      if (!f[k].trim()) e[k] = t('f_required')
    }
    ;(['firstName', 'lastName', 'birthDate', 'street', 'houseNumber', 'zip', 'city', 'email', 'phone'] as const).forEach(req)
    if (f.birthDate.trim() && !parseDate(f.birthDate)) e.birthDate = t('f_invalidDate')
    if (f.spouseBirthDate.trim() && !parseDate(f.spouseBirthDate)) e.spouseBirthDate = t('f_invalidDate')
    if (f.email.trim() && !emailRe.test(f.email.trim())) e.email = t('f_invalidEmail')
    if (f.zip.trim() && !/^\d{4,5}$/.test(f.zip.trim())) e.zip = t('f_invalidZip')
    if (!Number.isFinite(amount) || amount < fee.min) e.amount = `${t('f_minAmount')} ${fee.min} €`
    if (sepa) {
      req('accountHolder')
      if (!f.iban.trim()) e.iban = t('f_required')
      else if (!validIban(f.iban)) e.iban = t('f_invalidIban')
      if (!consentSepa) e.consentSepa = t('f_required')
    }
    if (!consentData) e.consentData = t('f_required')
    return e
  }, [f, amount, fee.min, sepa, consentData, consentSepa, t])

  const hasErrors = Object.keys(errors).length > 0
  const err = (k: keyof typeof errors) => (touched ? errors[k] : undefined)

  const submit = async () => {
    setTouched(true)
    setServerError(null)
    if (hasErrors) return
    setSending(true)
    const body: MembershipApplication = {
      ...f,
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      email: f.email.trim(),
      birthDate: parseDate(f.birthDate) ?? f.birthDate,
      spouseBirthDate: f.spouseBirthDate.trim() ? parseDate(f.spouseBirthDate) ?? f.spouseBirthDate : '',
      accountHolder: sepa ? f.accountHolder.trim() : '',
      bank: sepa ? f.bank.trim() : '',
      iban: sepa ? f.iban.replace(/\s+/g, '').toUpperCase() : '',
      bic: sepa ? f.bic.replace(/\s+/g, '').toUpperCase() : '',
      amount,
      consentData,
      consentSepa: sepa && consentSepa,
      lang,
    }
    try {
      await fetchJson('/api/membership', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 20000)
      setDone(true)
    } catch (e) {
      setServerError(e instanceof ApiError && e.status >= 400 && e.status < 500 && !/^HTTP /.test(e.message) ? e.message : t('f_error'))
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setF(EMPTY)
    setAmountChoice(MEMBERSHIP_FEES.monthly.options[0])
    setOtherAmount('')
    setConsentData(false)
    setConsentSepa(false)
    setTouched(false)
    setDone(false)
  }

  if (done) {
    return (
      <View style={[s.panel, { alignItems: 'center', paddingVertical: space.xxl }]}>
        <View style={s.okIcon}>
          <Feather name="check" size={26} color={colors.gold} />
        </View>
        <Text style={s.okTitle}>{t('f_successTitle')}</Text>
        <Text style={s.okText}>{t('f_successText')}</Text>
        <ToneProvider tone="default">
          <Btn label={t('f_another')} variant="secondary" onPress={reset} style={{ marginTop: space.xl }} />
        </ToneProvider>
      </View>
    )
  }

  return (
    <ToneProvider tone="default">
      <View style={{ gap: space.xl }}>
        <Group title={t('f_personal')}>
          <Row>
            <Field label={t('f_firstName')} value={f.firstName} onChange={set('firstName')} error={err('firstName')} required autoComplete="given-name" textContentType="givenName" />
            <Field label={t('f_lastName')} value={f.lastName} onChange={set('lastName')} error={err('lastName')} required autoComplete="family-name" textContentType="familyName" />
          </Row>
          <Row>
            <Field label={t('f_birthDate')} value={f.birthDate} onChange={set('birthDate')} error={err('birthDate')} required placeholder={t('f_datePh')} keyboardType="numbers-and-punctuation" maxLength={10} autoComplete="birthdate-full" />
            <Field label={t('f_birthPlace')} value={f.birthPlace} onChange={set('birthPlace')} />
          </Row>
          <Field label={t('f_job')} value={f.job} onChange={set('job')} />
        </Group>

        <Group title={t('f_address')}>
          <Row ratio={[2.4, 1]} stackBelow={220}>
            <Field label={t('f_street')} value={f.street} onChange={set('street')} error={err('street')} required autoComplete="street-address" textContentType="streetAddressLine1" />
            <Field label={t('f_houseNumber')} value={f.houseNumber} onChange={set('houseNumber')} error={err('houseNumber')} required />
          </Row>
          <Row ratio={[1, 1.6]} stackBelow={220}>
            <Field label={t('f_zip')} value={f.zip} onChange={set('zip')} error={err('zip')} required keyboardType="number-pad" maxLength={5} autoComplete="postal-code" textContentType="postalCode" />
            <Field label={t('f_city')} value={f.city} onChange={set('city')} error={err('city')} required textContentType="addressCity" />
          </Row>
        </Group>

        <Group title={t('f_contact')}>
          <Field label={t('f_email')} value={f.email} onChange={set('email')} error={err('email')} required keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          <Row>
            <Field label={t('f_phone')} value={f.phone} onChange={set('phone')} error={err('phone')} required keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
            <Field label={t('f_homePhone')} value={f.homePhone} onChange={set('homePhone')} keyboardType="phone-pad" optional={t('f_optional')} />
          </Row>
        </Group>

        <Group title={t('f_family')}>
          <Field label={t('f_spouse')} value={f.spouse} onChange={set('spouse')} optional={t('f_optional')} />
          <Row>
            <Field label={t('f_spouseBirthDate')} value={f.spouseBirthDate} onChange={set('spouseBirthDate')} error={err('spouseBirthDate')} placeholder={t('f_datePh')} keyboardType="numbers-and-punctuation" maxLength={10} />
            <Field label={t('f_spouseJob')} value={f.spouseJob} onChange={set('spouseJob')} />
          </Row>
          <Field label={t('f_children')} value={f.children} onChange={set('children')} multiline optional={t('f_optional')} />
        </Group>

        <Group title={t('f_fee')}>
          <Label text={t('f_interval')} />
          <Chips
            options={INTERVALS.map((i) => ({ id: i.id, label: i.label[lang] }))}
            value={f.interval}
            onChange={(id) => {
              setF((p) => ({ ...p, interval: id }))
              setAmountChoice(MEMBERSHIP_FEES[id].options[0])
              setOtherAmount('')
            }}
          />
          <Label text={t('f_amount')} style={{ marginTop: space.lg }} />
          <Chips
            options={[...fee.options.map((a) => ({ id: String(a), label: `${a} €` })), { id: 'other', label: t('f_otherAmount') }]}
            value={String(amountChoice)}
            onChange={(id) => setAmountChoice(id === 'other' ? 'other' : Number(id))}
          />
          {amountChoice === 'other' && (
            <Field
              label={`${t('f_amount')} (€)`}
              value={otherAmount}
              onChange={setOtherAmount}
              keyboardType="decimal-pad"
              placeholder={`${t('f_min')} ${fee.min}`}
              error={err('amount')}
              style={{ marginTop: space.md }}
            />
          )}
          {amountChoice !== 'other' && !!err('amount') && <Text style={s.error}>{err('amount')}</Text>}
          <Text style={s.help}>
            {t('f_min')} {fee.min} € {INTERVALS.find((i) => i.id === f.interval)?.per[lang]}
          </Text>

          <Label text={t('f_payMethod')} style={{ marginTop: space.lg }} />
          <View style={{ gap: space.sm }}>
            {PAY_METHODS.map((m) => {
              const on = f.payMethod === m.id
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setF((p) => ({ ...p, payMethod: m.id }))}
                  style={[s.radio, on && s.radioOn]}
                >
                  <View style={[s.radioDot, on && { borderColor: colors.green }]}>{on && <View style={s.radioInner} />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.radioLabel, on && { color: colors.green }]}>{m.label[lang]}</Text>
                    <Text style={s.radioHint}>{m.hint[lang]}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </Group>

        {sepa && (
          <Group title={t('f_sepa')}>
            <Field label={t('f_accountHolder')} value={f.accountHolder} onChange={set('accountHolder')} error={err('accountHolder')} required autoComplete="name" />
            <Field label={t('f_iban')} value={f.iban} onChange={set('iban')} error={err('iban')} required autoCapitalize="characters" placeholder="DE00 0000 0000 0000 0000 00" />
            <Row>
              <Field label={t('f_bank')} value={f.bank} onChange={set('bank')} />
              <Field label={t('f_bic')} value={f.bic} onChange={set('bic')} autoCapitalize="characters" />
            </Row>
            <Check checked={consentSepa} onChange={setConsentSepa} text={MEMBERSHIP_CONSENT.sepa[lang]} error={err('consentSepa')} />
          </Group>
        )}

        <Group title={t('f_consents')}>
          <Check checked={consentData} onChange={setConsentData} text={MEMBERSHIP_CONSENT.data[lang]} error={err('consentData')} />
        </Group>

        {touched && hasErrors && <Text style={[s.error, { fontSize: 14 }]}>{t('f_fixErrors')}</Text>}
        {!!serverError && (
          <View style={s.serverError}>
            <Feather name="alert-circle" size={18} color={colors.danger} />
            <Text style={[s.error, { flex: 1, marginTop: 0, fontSize: 14 }]}>{serverError}</Text>
          </View>
        )}
        <Btn label={sending ? t('f_sending') : t('f_submit')} onPress={submit} disabled={sending} full />
      </View>
    </ToneProvider>
  )
}

// ── Pomoćne komponente ────────────────────────────────────────────────────────

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={s.panel}>
      <Text style={s.groupTitle}>{title}</Text>
      <View style={{ gap: space.md }}>{children}</View>
    </View>
  )
}

/** Dva polja u redu; na uskim ekranima jedno ispod drugog. */
function Row({ children, ratio = [1, 1], stackBelow = 300 }: { children: ReactNode; ratio?: [number, number]; stackBelow?: number }) {
  const [w, setW] = useState(0)
  const arr = Array.isArray(children) ? children : [children]
  const stacked = w > 0 && w < stackBelow
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: stacked ? 'column' : 'row', gap: space.md }}>
      {arr.map((c, i) => (
        <View key={i} style={stacked ? undefined : { flex: ratio[i] ?? 1, minWidth: 0 }}>
          {c}
        </View>
      ))}
    </View>
  )
}

function Label({ text, style }: { text: string; style?: object }) {
  return <Text style={[s.label, style]}>{text}</Text>
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  optional,
  multiline,
  style,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  required?: boolean
  optional?: string
  multiline?: boolean
  style?: object
  keyboardType?: KeyboardTypeOptions
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'onChange' | 'style'>) {
  const [focus, setFocus] = useState(false)
  const ref = useRef<React.ComponentRef<typeof TextInput>>(null)
  return (
    <View style={style}>
      <Text style={s.label} onPress={() => ref.current?.focus()}>
        {label}
        {required ? <Text style={{ color: colors.gold }}> *</Text> : null}
        {optional ? <Text style={s.optional}> ({optional})</Text> : null}
      </Text>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        multiline={multiline}
        placeholderTextColor="#9aa29d"
        accessibilityLabel={label}
        maxFontSizeMultiplier={1.4}
        style={[s.input, multiline && { minHeight: 84, textAlignVertical: 'top', paddingTop: 12 }, focus && s.inputFocus, !!error && s.inputError]}
        {...rest}
      />
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  )
}

function Chips<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: string; onChange: (id: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {options.map((o) => {
        const on = o.id === value
        return (
          <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => onChange(o.id)} style={[s.chip, on && s.chipOn]}>
            <Text style={[s.chipText, on && { color: colors.onDark }]}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function Check({ checked, onChange, text, error }: { checked: boolean; onChange: (v: boolean) => void; text: string; error?: string }) {
  return (
    <View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => onChange(!checked)} style={s.check}>
        <View style={[s.box, checked && s.boxOn, !!error && !checked && { borderColor: colors.danger }]}>{checked && <Feather name="check" size={15} color={colors.onDark} />}</View>
        <Text style={s.checkText}>{text}</Text>
      </Pressable>
      {!!error && <Text style={[s.error, { marginLeft: 34 }]}>{error}</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  panel: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: space.lg + 2 },
  groupTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.green, marginBottom: space.md },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, marginBottom: 6 },
  optional: { fontFamily: fonts.body, color: colors.muted },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  inputFocus: { borderColor: colors.green },
  inputError: { borderColor: colors.danger },
  error: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.danger, marginTop: 4 },
  help: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: space.sm },
  chip: { paddingHorizontal: space.lg, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, minHeight: 42, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.ink, fontVariant: ['tabular-nums'] },
  radio: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  radioOn: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  radioDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  radioLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  radioHint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 1 },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  box: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginTop: 1, backgroundColor: colors.white },
  boxOn: { backgroundColor: colors.green, borderColor: colors.green },
  checkText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.ink },
  serverError: { flexDirection: 'row', gap: space.sm, alignItems: 'center', padding: space.md, borderRadius: radius.sm, backgroundColor: '#f8e6e3' },
  okIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  okTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.green, marginTop: space.lg, textAlign: 'center' },
  okText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.muted, marginTop: space.sm, textAlign: 'center' },
})


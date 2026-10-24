import { FormEvent, ReactNode, useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { API_URL } from './site'
import { ui } from './ui'
import { MEMBERSHIP_CONSENT, MEMBERSHIP_FEES, type MembershipApplication } from './types'

type Fields = Omit<MembershipApplication, 'amount' | 'consentData' | 'consentSepa' | 'lang'>

const EMPTY: Fields = {
  firstName: '', lastName: '', birthDate: '', birthPlace: '', job: '',
  street: '', houseNumber: '', zip: '', city: '',
  email: '', phone: '', homePhone: '',
  spouse: '', spouseBirthDate: '', spouseJob: '', children: '',
  payMethod: 'sepa', interval: 'monthly',
  accountHolder: '', bank: '', iban: '', bic: '',
}

export default function MembershipForm() {
  const { lang } = useLang()
  const s = ui(lang).form
  const [f, setF] = useState<Fields>(EMPTY)
  const [preset, setPreset] = useState<number | 'other'>(MEMBERSHIP_FEES.monthly.options[0])
  const [other, setOther] = useState('')
  const [consentData, setConsentData] = useState(false)
  const [consentSepa, setConsentSepa] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')

  const fees = MEMBERSHIP_FEES[f.interval]
  const amount = preset === 'other' ? Number(other.replace(',', '.')) : preset
  const set = (key: keyof Fields) => (e: { target: { value: string } }) => setF({ ...f, [key]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!(amount >= fees.min)) {
      setError(`${s.amount}: min. ${fees.min} €`)
      return
    }
    setStatus('sending')
    try {
      const body: MembershipApplication = { ...f, amount, consentData, consentSepa: f.payMethod === 'sepa' && consentSepa, lang }
      const response = await fetch(`${API_URL}/api/membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const problem = await response.json().catch(() => null)
        throw new Error(problem?.error ?? s.error)
      }
      setStatus('done')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : s.error)
    }
  }

  if (status === 'done') return <div className="form-success" role="status">{s.success}</div>

  const field = (key: keyof Fields, label: string, props: { required?: boolean; type?: string; autoComplete?: string; wide?: boolean } = {}) => (
    <label className={`field ${props.wide ? 'field-wide' : ''}`}>
      <span>
        {label}
        {props.required && <abbr title={s.required}> *</abbr>}
      </span>
      <input value={f[key]} onChange={set(key)} required={props.required} type={props.type ?? 'text'} autoComplete={props.autoComplete} />
    </label>
  )

  const Group = ({ title, children }: { title: string; children: ReactNode }) => (
    <fieldset className="form-group">
      <legend>{title}</legend>
      <div className="form-grid">{children}</div>
    </fieldset>
  )

  return (
    <form className="form membership-form" onSubmit={submit}>
      {Group({
        title: s.applicant,
        children: (
          <>
            {field('firstName', s.firstName, { required: true, autoComplete: 'given-name' })}
            {field('lastName', s.lastName, { required: true, autoComplete: 'family-name' })}
            {field('birthDate', s.birthDate, { type: 'date', autoComplete: 'bday' })}
            {field('birthPlace', s.birthPlace)}
            {field('job', s.job, { wide: true })}
          </>
        ),
      })}
      {Group({
        title: s.address,
        children: (
          <>
            {field('street', s.street, { autoComplete: 'address-line1' })}
            {field('houseNumber', s.houseNumber)}
            {field('zip', s.zip, { autoComplete: 'postal-code' })}
            {field('city', s.city, { autoComplete: 'address-level2' })}
          </>
        ),
      })}
      {Group({
        title: s.contact,
        children: (
          <>
            {field('email', s.email, { required: true, type: 'email', autoComplete: 'email', wide: true })}
            {field('phone', s.phone, { type: 'tel', autoComplete: 'tel' })}
            {field('homePhone', s.homePhone, { type: 'tel' })}
          </>
        ),
      })}
      {Group({
        title: s.family,
        children: (
          <>
            {field('spouse', s.spouse, { wide: true })}
            {field('spouseBirthDate', s.spouseBirthDate, { type: 'date' })}
            {field('spouseJob', s.spouseJob)}
            {field('children', s.children, { wide: true })}
          </>
        ),
      })}

      <fieldset className="form-group">
        <legend>{s.fee}</legend>
        <div className="form-grid">
          <label className="field">
            <span>{s.interval}</span>
            <select
              value={f.interval}
              onChange={(e) => {
                setF({ ...f, interval: e.target.value })
                setPreset(MEMBERSHIP_FEES[e.target.value].options[0])
              }}
            >
              {Object.entries(s.intervals).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{s.payMethod}</span>
            <select value={f.payMethod} onChange={set('payMethod')}>
              {Object.entries(s.payMethods).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <div className="field field-wide">
            <span>{s.amount}</span>
            <div className="choice-row" role="radiogroup">
              {fees.options.map((value, i) => (
                <button type="button" key={value} role="radio" aria-checked={preset === value} className={`choice ${preset === value ? 'on' : ''}`} onClick={() => setPreset(value)}>
                  <strong>{value} €</strong>
                  <small>{i === 0 ? s.minimum : s.average}</small>
                </button>
              ))}
              <button type="button" role="radio" aria-checked={preset === 'other'} className={`choice ${preset === 'other' ? 'on' : ''}`} onClick={() => setPreset('other')}>
                <strong>&gt; {fees.options[fees.options.length - 1]} €</strong>
                <small>{s.other}</small>
              </button>
            </div>
          </div>
          {preset === 'other' && (
            <label className="field">
              <span>{s.otherAmount}</span>
              <input inputMode="decimal" value={other} onChange={(e) => setOther(e.target.value)} required />
            </label>
          )}
        </div>
      </fieldset>

      {f.payMethod === 'sepa' ? (
        <fieldset className="form-group">
          <legend>{s.sepa}</legend>
          <div className="form-grid">
            {field('accountHolder', s.accountHolder, { required: true, autoComplete: 'cc-name' })}
            {field('bank', s.bank)}
            {field('iban', s.iban, { required: true })}
            {field('bic', s.bic)}
          </div>
          <label className="check">
            <input type="checkbox" checked={consentSepa} onChange={(e) => setConsentSepa(e.target.checked)} required />
            <span>{MEMBERSHIP_CONSENT.sepa[lang]}</span>
          </label>
        </fieldset>
      ) : f.payMethod === 'transfer' ? (
        <div className="form-note">
          {s.transferInfo} <strong>IGBD – Gemeinde IKC Düsseldorf e.V. · Stadtsparkasse Düsseldorf · IBAN DE91 3005 0110 0021 0471 88 · BIC DUSSDEDDXXX</strong>
        </div>
      ) : null}

      <label className="check">
        <input type="checkbox" checked={consentData} onChange={(e) => setConsentData(e.target.checked)} required />
        <span>{MEMBERSHIP_CONSENT.data[lang]}</span>
      </label>
      <p className="form-privacy">{s.privacy}</p>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={status === 'sending'}>
        {status === 'sending' ? s.sending : s.submit}
      </button>
    </form>
  )
}

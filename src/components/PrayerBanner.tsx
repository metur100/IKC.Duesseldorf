import { useLang } from '../context/LanguageContext'
import { content } from '../i18n/content'

export default function PrayerBanner() {
  const { lang } = useLang()
  const t = content[lang]
  return (
    <div className="prayer-strip">
      <div className="container">
        <div className="p-item"><strong>{t.prayer.dzuma}</strong></div>
      </div>
    </div>
  )
}

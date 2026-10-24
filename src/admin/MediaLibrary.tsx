import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { useAdmin } from './state'
import { Icon } from './icons'
import { Modal } from './ui'
import { imageUrl } from '../cms/links'

/** Sve slike koje sadržaj već koristi (i one u /images na stranici). */
function usedImages(json: unknown): string[] {
  const found = new Set<string>()
  JSON.stringify(json).replace(/"(?:image|url)":"([^"]+)"/g, (_, url: string) => {
    if (/\.(jpe?g|png|webp|gif|svg)$/i.test(url) || url.startsWith('https://i.ibb.co/')) found.add(url)
    return ''
  })
  return [...found]
}

/** Biblioteka slika: odabir postojeće ili upload nove (ide na ImgBB preko backend-a). */
export default function MediaLibrary({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const { images, loadImages, addImage, toast, site } = useAdmin()
  const [busy, setBusy] = useState(0)
  const [over, setOver] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!images) void loadImages()
  }, [images, loadImages])

  const siteImages = useMemo(() => usedImages(site).filter((u) => u.startsWith('/')), [site])

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    setBusy((n) => n + list.length)
    let last = ''
    for (const file of list) {
      try {
        const image = await api.uploadImage(file, file.name.replace(/\.[^.]+$/, ''))
        addImage(image)
        last = image.url
      } catch (err) {
        toast(`${file.name}: ${(err as Error).message}`, 'error')
      } finally {
        setBusy((n) => n - 1)
      }
    }
    if (list.length === 1 && last) onSelect(last)
    else if (last) toast(`Učitano ${list.length} slika.`)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    void upload(e.dataTransfer.files)
  }

  const uploaded = (images ?? []).filter((img) => !filter || (img.title ?? '').toLowerCase().includes(filter.toLowerCase()))

  return (
    <Modal title="Odaberi sliku" onClose={onClose} wide>
      <label
        className={`a-drop ${over ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <Icon name="upload" size={26} />
        <strong>{busy ? `Učitavam (${busy})…` : 'Učitaj novu sliku'}</strong>
        <span>Prevucite slike ovdje ili kliknite. Na mobitelu možete i fotografisati. JPG, PNG, WEBP do 32 MB.</span>
        <input type="file" accept="image/*" multiple onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && void upload(e.target.files)} />
      </label>

      <div className="a-media-head">
        <h3>Učitane slike</h3>
        <input className="a-input a-input-sm" placeholder="Traži…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      {!images ? <p className="a-muted">Učitavanje…</p> : uploaded.length === 0 ? <p className="a-muted">Još nema učitanih slika.</p> : (
        <ul className="a-media-grid">
          {uploaded.map((img) => (
            <li key={img.id}>
              <button type="button" onClick={() => onSelect(img.url)} title={img.title ?? ''}>
                <img src={img.thumbUrl ?? img.displayUrl} alt={img.title ?? ''} loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {siteImages.length > 0 && (
        <>
          <div className="a-media-head"><h3>Slike sa stranice</h3></div>
          <ul className="a-media-grid">
            {siteImages.map((url) => (
              <li key={url}>
                <button type="button" onClick={() => onSelect(url)} title={url}>
                  <img src={imageUrl(url)} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}

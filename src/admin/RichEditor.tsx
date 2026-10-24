import { useEffect, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import type { RichDoc } from '../cms/types'

/** Uređivač formatiranog teksta (TipTap). Čuva JSON (RichDoc), isti koji prikazuju stranica i aplikacija. */
export default function RichEditor({ value, onChange, pages }: { value: RichDoc; onChange: (doc: RichDoc) => void; pages: { slug: string; title: string }[] }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false, strike: false, horizontalRule: false }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null } }),
    ],
    content: value?.content?.length ? value : '',
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichDoc),
  })

  // Vanjska promjena (npr. vraćena revizija) — osvježi sadržaj editora.
  useEffect(() => {
    if (!editor || editor.isFocused) return
    const current = JSON.stringify(editor.getJSON())
    const next = value?.content?.length ? value : { type: 'doc', content: [{ type: 'paragraph' }] }
    if (current !== JSON.stringify(next)) editor.commands.setContent(next, false)
  }, [editor, value])

  return (
    <div className="rte">
      {editor && <Toolbar editor={editor} pages={pages} />}
      <EditorContent editor={editor} className="rte-content prose" />
    </div>
  )
}

function Toolbar({ editor, pages }: { editor: Editor; pages: { slug: string; title: string }[] }) {
  const [linking, setLinking] = useState(false)
  const [href, setHref] = useState('')
  const [, force] = useState(0)

  useEffect(() => {
    const update = () => force((n) => n + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  const btn = (label: string, title: string, active: boolean, run: () => void) => (
    <button type="button" title={title} aria-label={title} aria-pressed={active} className={active ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onClick={run}>
      {label}
    </button>
  )

  const openLink = () => {
    setHref((editor.getAttributes('link').href as string) ?? '')
    setLinking(true)
  }
  const applyLink = () => {
    const chain = editor.chain().focus().extendMarkRange('link')
    if (href.trim()) chain.setLink({ href: href.trim() }).run()
    else chain.unsetLink().run()
    setLinking(false)
  }

  return (
    <div className="rte-toolbar">
      <div className="rte-buttons">
        {btn('B', 'Podebljano', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
        {btn('I', 'Kurziv', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
        {btn('H2', 'Podnaslov', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        {btn('H3', 'Manji podnaslov', editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
        {btn('•', 'Lista', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
        {btn('1.', 'Numerisana lista', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
        {btn('❝', 'Citat', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run())}
        {btn('Link', 'Link', editor.isActive('link'), openLink)}
        {btn('↶', 'Poništi', false, () => editor.chain().focus().undo().run())}
        {btn('↷', 'Ponovi', false, () => editor.chain().focus().redo().run())}
      </div>
      {linking && (
        <div className="rte-link">
          <input
            autoFocus
            list="rte-pages"
            placeholder="/stranica, https://…, tel:…, mailto:…"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyLink()
              }
              if (e.key === 'Escape') setLinking(false)
            }}
          />
          <datalist id="rte-pages">
            {pages.map((p) => <option key={p.slug} value={p.slug === 'home' ? '/' : `/${p.slug}`}>{p.title}</option>)}
          </datalist>
          <button type="button" className="a-btn a-btn-primary a-btn-sm" onClick={applyLink}>OK</button>
          <button type="button" className="a-btn a-btn-sm" onClick={() => setLinking(false)}>Odustani</button>
        </div>
      )}
    </div>
  )
}

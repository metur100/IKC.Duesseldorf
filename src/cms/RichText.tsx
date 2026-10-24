import { ReactNode } from 'react'
import type { RichDoc, RichNode } from './types'
import { SmartLink } from './links'

/** Prikaz formatiranog teksta (TipTap JSON) bez dangerouslySetInnerHTML. */
export default function RichText({ doc, className }: { doc: RichDoc | undefined; className?: string }) {
  if (!doc?.content?.length) return null
  return <div className={`prose ${className ?? ''}`}>{renderNodes(doc.content)}</div>
}

export const isEmptyRich = (doc: RichDoc | undefined) =>
  !doc?.content?.some((n) => n.type !== 'paragraph' || n.content?.some((c) => c.text?.trim() || c.type !== 'text'))

function renderNodes(nodes: RichNode[] | undefined): ReactNode[] {
  return (nodes ?? []).map((node, i) => renderNode(node, i))
}

function renderNode(node: RichNode, key: number): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{renderNodes(node.content)}</p>
    case 'heading':
      return node.attrs?.level === 2 ? <h2 key={key}>{renderNodes(node.content)}</h2> : <h3 key={key}>{renderNodes(node.content)}</h3>
    case 'bulletList':
      return <ul key={key}>{renderNodes(node.content)}</ul>
    case 'orderedList':
      return <ol key={key}>{renderNodes(node.content)}</ol>
    case 'listItem':
      return <li key={key}>{renderNodes(node.content)}</li>
    case 'blockquote':
      return <blockquote key={key}>{renderNodes(node.content)}</blockquote>
    case 'hardBreak':
      return <br key={key} />
    case 'horizontalRule':
      return <hr key={key} />
    case 'text':
      return renderText(node, key)
    default:
      return node.content ? <span key={key}>{renderNodes(node.content)}</span> : null
  }
}

function renderText(node: RichNode, key: number): ReactNode {
  let out: ReactNode = node.text ?? ''
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') out = <strong>{out}</strong>
    else if (mark.type === 'italic') out = <em>{out}</em>
    else if (mark.type === 'link' && typeof mark.attrs?.href === 'string') out = <SmartLink href={mark.attrs.href}>{out}</SmartLink>
  }
  return <span key={key}>{out}</span>
}

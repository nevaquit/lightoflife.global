type LexicalTextNode = {
  type: 'text'
  text: string
  format?: number
}

type LexicalElementNode = {
  type: string
  tag?: string
  children?: LexicalNode[]
  listType?: 'bullet' | 'number'
  value?: number | { id?: string | number; url?: string; alt?: string }
  relationTo?: string
}

type LexicalNode = LexicalTextNode | LexicalElementNode

type LexicalRoot = {
  root?: {
    children?: LexicalNode[]
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderText(node: LexicalTextNode): string {
  let text = escapeHtml(node.text)
  const format = node.format ?? 0

  if (format & 1) text = `<strong>${text}</strong>`
  if (format & 2) text = `<em>${text}</em>`
  if (format & 4) text = `<s>${text}</s>`
  if (format & 8) text = `<u>${text}</u>`

  return text
}

function renderChildren(children: LexicalNode[] | undefined, cmsUrl = ''): string {
  return (children ?? []).map((node) => renderNode(node, cmsUrl)).join('')
}

function renderUpload(node: LexicalElementNode, cmsUrl: string): string {
  const value = node.value
  let url: string | undefined
  let alt = ''
  if (value && typeof value === 'object') {
    url = value.url
    alt = value.alt ?? ''
  }
  if (!url) return ''
  const src = url.startsWith('http') ? url : `${cmsUrl}${url}`
  return `<figure class="my-8"><img src="${src}" alt="${escapeHtml(alt)}" class="w-full rounded-xl" loading="lazy" /></figure>`
}

function renderNode(node: LexicalNode, cmsUrl = ''): string {
  if (node.type === 'text') {
    return renderText(node as LexicalTextNode)
  }

  const element = node as LexicalElementNode

  if (element.type === 'upload') {
    return renderUpload(element, cmsUrl)
  }

  const inner = renderChildren(element.children, cmsUrl)

  switch (element.type) {
    case 'paragraph':
      return inner ? `<p>${inner}</p>` : ''
    case 'heading': {
      const tag = element.tag ?? 'h2'
      return inner ? `<${tag}>${inner}</${tag}>` : ''
    }
    case 'quote':
      return inner ? `<blockquote>${inner}</blockquote>` : ''
    case 'linebreak':
      return '<br />'
    case 'link':
      return inner ? `<a href="#">${inner}</a>` : ''
    case 'list': {
      const tag = element.listType === 'number' ? 'ol' : 'ul'
      return inner ? `<${tag}>${inner}</${tag}>` : ''
    }
    case 'listitem':
      return inner ? `<li>${inner}</li>` : ''
    default:
      return inner
  }
}

function collectPlainText(children: LexicalNode[] | undefined): string {
  return (children ?? [])
    .map((node) => {
      if (node.type === 'text') return (node as LexicalTextNode).text
      return collectPlainText((node as LexicalElementNode).children)
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function lexicalToHtml(content: unknown, cmsUrl = ''): string {
  if (!content || typeof content !== 'object') return ''

  const root = content as LexicalRoot
  const html = renderChildren(root.root?.children, cmsUrl)

  return html || ''
}

export function lexicalToPlainText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const root = content as LexicalRoot
  return collectPlainText(root.root?.children)
}

export function lexicalExcerpt(content: unknown, maxLength = 180): string {
  const text = lexicalToPlainText(content)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '')}…`
}

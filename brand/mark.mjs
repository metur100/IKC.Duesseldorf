// Generates the IKC mark: crescent bowl holding a mosque (dome + minaret) and the Rheinturm.
// Coordinates on a 512 canvas.
export function markGroup({ bowl, sky, id = 'm' }) {
  // Crescent: outer circle minus inner circle shifted up.
  const crescent = `<mask id="${id}-cut"><rect x="-200" y="-200" width="912" height="912" fill="#fff"/><circle cx="256" cy="212" r="168" fill="#000"/></mask><circle cx="256" cy="268" r="176" fill="${bowl}" mask="url(#${id}-cut)"/>`
  // Clip the skyline to the inner circle so it sits inside the bowl.
  const clip = `<clipPath id="${id}-in"><circle cx="256" cy="212" r="166" /><rect x="0" y="0" width="512" height="212"/></clipPath>`
  const sky_ = `
    <g fill="${sky}" clip-path="url(#${id}-in)">
      <!-- dome + drum -->
      <path d="M 192 334 C 192 290 222 262 256 252 C 290 262 320 290 320 334 Z" />
      <rect x="186" y="330" width="140" height="80" />
      <rect x="252.5" y="226" width="7" height="30" rx="3.5" />
      <circle cx="256" cy="222" r="7" />
      <!-- minaret -->
      <rect x="146" y="214" width="24" height="200" />
      <rect x="140" y="246" width="36" height="9" rx="2" />
      <path d="M 143 214 L 158 160 L 173 214 Z" />
      <rect x="155.5" y="140" width="5" height="22" rx="2.5" />
      <!-- Rheinturm -->
      <path d="M 346 420 L 352 196 L 360 196 L 366 420 Z" />
      <path d="M 334 196 C 334 186 344 180 356 180 C 368 180 378 186 378 196 L 378 202 C 378 208 368 212 356 212 C 344 212 334 208 334 202 Z" />
      <rect x="341" y="168" width="30" height="8" rx="4" />
      <rect x="353.5" y="96" width="5" height="74" rx="2.5" />
    </g>`
  return { defs: clip, body: crescent + sky_ }
}

export function markSvg({ bowl, sky, bg = null, pad = 0, size = 512, radius = 0 }) {
  const { defs, body } = markGroup({ bowl, sky })
  const s = 512 + pad * 2
  const bgRect = bg ? `<rect x="${-pad}" y="${-pad}" width="${s}" height="${s}" rx="${radius}" fill="${bg}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${s} ${s}" width="${size}" height="${size}"><defs>${defs}</defs>${bgRect}<g transform="translate(0,-14)">${body}</g></svg>`
}

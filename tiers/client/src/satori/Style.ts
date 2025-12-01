


export function css(strings: TemplateStringsArray, ...args: string[]): string {
  return strings[0]
  // var out = ""
  // strings.forEach((s, i) => { out += s; if (i < args.length) out += args[i] })
  // return out
}

export function StyleAdd(t: string, s: string) {
  const style = document.createElement("style")
  style.textContent = s
  style.title = t
  document.head.appendChild(style)
}

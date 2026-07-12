export function getSection(markdown, heading) {
  const lines = markdown.split(/\r\n|\n|\r/);
  const headingPattern = new RegExp(`^(#{1,6})\\s+${escapeRegExp(heading)}\\s*$`);
  let start = -1;
  let level = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(headingPattern);
    if (match) {
      start = index + 1;
      level = match[1].length;
      break;
    }
  }

  if (start < 0) return null;

  const endPattern = new RegExp(`^#{1,${level}}\\s+`);
  const body = [];
  for (let index = start; index < lines.length; index += 1) {
    if (endPattern.test(lines[index])) break;
    body.push(lines[index]);
  }

  return body.join('\n').trim();
}

export function getField(markdown, field) {
  if (!markdown) return '';
  const pattern = new RegExp(`^\\s*-\\s*${escapeRegExp(field)}\\s*:\\s*(.+?)\\s*$`, 'im');
  const match = markdown.match(pattern);
  if (!match) return '';
  return normalizeCell(match[1]);
}

export function normalizeCell(value) {
  return String(value ?? '').trim().replace(/^`|`$/g, '').trim();
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else if (inQ) { inQ = false; }
      else if (cur.length === 0) { inQ = true; }
      else { cur += '"'; }
    } else if (ch === ';' && !inQ) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      const v = (vals[i] !== undefined) ? vals[i] : '';
      if (v.startsWith('{') || v.startsWith('[')) {
        try { obj[h] = JSON.parse(v); } catch { obj[h] = v; }
      } else {
        obj[h] = v;
      }
    });
    return obj;
  });
}

export function dateKey(isoStr) {
  return isoStr ? isoStr.substring(0, 10) : '';
}

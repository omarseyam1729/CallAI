// Small shared helpers used across the CallsList page & components.

export const fmtDuration = (sec) => {
  const s = Math.floor(Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
};

export const startOfDayISO = (yyyyMmDd) =>
  (yyyyMmDd ? new Date(`${yyyyMmDd}T00:00:00`).toISOString() : null);

export const nextDayISO = (yyyyMmDd) => {
  if (!yyyyMmDd) return null;
  const d = new Date(`${yyyyMmDd}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
};

export const toInt = (v, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
};

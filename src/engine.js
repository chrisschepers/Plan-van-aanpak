/* Rekenmotor — deterministisch opbouwschema.
   Zelfde input, zelfde uitkomst: geen gegenereerde cijfers of aannames. */

function fmtDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/**
 * Bouwt het opbouwschema: vanaf startDate elke week `weeklyIncrease` uur erbij,
 * van startHours tot (en met) contractHours.
 * @returns {Array<{date: string, hours: number, pct: number}>}
 */
export function computeSchema({ contractHours, startHours, weeklyIncrease, startDate }) {
  const rows = [];
  const d = new Date(startDate + "T00:00:00");
  for (let h = startHours; ; h += weeklyIncrease) {
    const hours = Math.min(h, contractHours);
    rows.push({ date: fmtDate(d), hours, pct: Math.round((hours / contractHours) * 100) });
    if (hours >= contractHours) break;
    d.setDate(d.getDate() + 7);
  }
  return rows;
}

/** Datum (dd-mm-jjjj) van volledige werkhervatting = laatste rij van het schema. */
export function fullRecoveryDate(schema) {
  return schema[schema.length - 1].date;
}

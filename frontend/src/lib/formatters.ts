export function formatNIS(price: number | null | undefined): string {
  if (!price) return "—";
  return `₪${price.toLocaleString("he-IL")}`;
}

export function formatRooms(rooms: number | null | undefined): string {
  if (rooms == null) return "—";
  return `${rooms} חד'`;
}

export function formatSqm(sqm: number | null | undefined): string {
  if (!sqm) return "—";
  return `${sqm} מ"ר`;
}

export function formatFloor(floor: number | null | undefined, total?: number | null): string {
  if (floor == null) return "—";
  if (floor === 0) return "קרקע";
  if (total) return `קומה ${floor}/${total}`;
  return `קומה ${floor}`;
}

export function formatPricePerSqm(v: number | null | undefined): string {
  if (!v) return "—";
  return `₪${v.toLocaleString("he-IL")} למ"ר`;
}

export function agentLabel(v: string | null | undefined): string {
  if (v === "owner") return "בעל דירה";
  if (v === "agent") return "מתווך";
  return "—";
}

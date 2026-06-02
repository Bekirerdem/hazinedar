/**
 * Tarihsel ve guncel USD/TRY kuru ceker (frankfurter.app - ECB tabanli, ucretsiz, anahtar gerekmez).
 */
export type RatePoint = { date: string; rate: number };

export async function fetchUsdTry(start: string, end: string): Promise<RatePoint[]> {
  const url = `https://api.frankfurter.app/${start}..${end}?from=USD&to=TRY`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`frankfurter fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { rates: Record<string, { TRY: number }> };
  const points = Object.entries(data.rates)
    .map(([date, obj]) => ({ date, rate: obj.TRY }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (points.length === 0) {
    throw new Error("frankfurter bos seri dondurdu");
  }
  return points;
}

/** Guncel (son) USD/TRY kuru - canli on-chain oracle beslemesi icin. */
export async function fetchLiveUsdTry(): Promise<number> {
  const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=TRY");
  if (!res.ok) {
    throw new Error(`frankfurter live fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { rates: { TRY: number } };
  return data.rates.TRY;
}

/** Sirali kur serisini gunluk dizilere donusturur (sadece rate degerleri). */
export function ratesOf(points: RatePoint[]): number[] {
  return points.map((p) => p.rate);
}

"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Single-series charts (one measure per chart — never a dual axis).
 * Mark: brand burgundy on a white card (contrast ≈ 14:1). Grid/axes recessive in beige/muted.
 * Text stays in ink tokens; the title names the series, so no legend box is needed.
 */
const MARK = "#4A1022";
const GRID = "#E6D3C7";
const INK_MUTED = "#6B5753";

type Point = { label: string; value: number };

const taka = (poisha: number) => `৳${new Intl.NumberFormat("en-IN").format(Math.round(poisha / 100))}`;
const compactTaka = (poisha: number) => {
  const t = poisha / 100;
  return t >= 100000 ? `৳${(t / 100000).toFixed(1)}L` : t >= 1000 ? `৳${(t / 1000).toFixed(t >= 10000 ? 0 : 1)}k` : `৳${t}`;
};

function ChartTooltip({ active, payload, label, money }: { active?: boolean; payload?: { value: number }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="border border-beige bg-white px-3 py-2 text-[12.5px] shadow-md">
      <p className="text-muted">{label}</p>
      <p className="font-medium tabular-nums text-charcoal">{money ? taka(v) : `${v} order${v === 1 ? "" : "s"}`}</p>
    </div>
  );
}

export function TrendChart({ data, kind, height = 240 }: { data: Point[]; kind: "money" | "count"; height?: number }) {
  const money = kind === "money";
  const total = data.reduce((s, d) => s + d.value, 0);
  const tickEvery = Math.max(1, Math.ceil(data.length / 7));
  return (
    <figure>
      <div style={{ height }} role="img" aria-label={`${money ? "Revenue" : "Orders"} trend: total ${money ? taka(total) : total} over ${data.length} periods`}>
        <ResponsiveContainer width="100%" height="100%">
          {money ? (
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={MARK} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={MARK} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: INK_MUTED, fontSize: 11 }} interval={tickEvery - 1} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 11 }} tickFormatter={compactTaka} width={56} allowDecimals={false} domain={[0, (max: number) => Math.max(max, 100000)]} />
              <Tooltip content={<ChartTooltip money />} cursor={{ stroke: INK_MUTED, strokeDasharray: "3 3" }} />
              <Area type="monotone" dataKey="value" stroke={MARK} strokeWidth={2} fill="url(#rev)" dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: MARK }} />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: INK_MUTED, fontSize: 11 }} interval={tickEvery - 1} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: INK_MUTED, fontSize: 11 }} width={32} allowDecimals={false} domain={[0, (max: number) => Math.max(max, 4)]} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(230,211,199,0.45)" }} />
              <Bar dataKey="value" fill={MARK} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-[12.5px] text-muted">
        <summary className="cursor-pointer select-none">View as table</summary>
        <div className="mt-2 max-h-56 overflow-y-auto">
          <table className="w-full">
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-b border-beige/60">
                  <td className="py-1">{d.label}</td>
                  <td className="py-1 text-right tabular-nums text-charcoal">{money ? taka(d.value) : d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** Horizontal magnitude bars (one hue) for ranked categories/products. */
export function RankBars({ data, money = true }: { data: Point[]; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="py-6 text-center text-[13px] text-muted">No sales in this period.</p>;
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} title={`${d.label}: ${money ? taka(d.value) : d.value}`}>
          <div className="mb-1 flex justify-between gap-3 text-[13px]">
            <span className="truncate text-charcoal">{d.label}</span>
            <span className="shrink-0 tabular-nums text-charcoal">{money ? taka(d.value) : d.value}</span>
          </div>
          <div className="h-2 bg-cream-light">
            <div className="h-2 rounded-r-[4px] bg-burgundy" style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

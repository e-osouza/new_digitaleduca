"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import { formatarDuracao, rotuloTipo } from "@/lib/format";
import type { EstatisticasDetalhadas } from "@/types/api";

/**
 * Cores vindas dos tokens do tema (`var(--color-*)`), então os gráficos
 * acompanham claro/escuro sem código extra. A ordem dá o rodízio do donut.
 */
const PALETA = [
  "var(--color-acento)",
  "var(--color-acento-claro)",
  "var(--color-sucesso)",
  "var(--color-progresso)",
  "var(--color-gratis)",
];

const EIXO = "var(--color-texto-3)";

/** Tooltip no visual do tema (superfície + borda), com o valor em tempo. */
function DicaTempo({
  active,
  payload,
  sufixo = "",
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: { nome?: string } }[];
  sufixo?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const nome = p.payload?.nome ?? p.name ?? "";
  return (
    <div className="border-borda-suave bg-superficie rounded-lg border px-3 py-2 text-xs shadow-lg">
      <p className="text-texto font-semibold">{nome}</p>
      <p className="text-texto-3 tabular-nums">
        {sufixo === "min" ? `${p.value} vídeos` : formatarDuracao(Number(p.value))}
      </p>
    </div>
  );
}

/* -------------------------- donut por tipo -------------------------- */

export function DonutTipo({ dados }: { dados: EstatisticasDetalhadas["porTipo"] }) {
  const data = dados.map((t) => ({ nome: rotuloTipo(t.tipo), segundos: t.segundos }));
  const total = data.reduce((s, d) => s + d.segundos, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie isAnimationActive={false}
              data={data}
              dataKey="segundos"
              nameKey="nome"
              innerRadius={58}
              outerRadius={85}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETA[i % PALETA.length]} />
              ))}
            </Pie>
            <Tooltip content={<DicaTempo />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg font-semibold tabular-nums">
            {formatarDuracao(total)}
          </span>
          <span className="text-texto-3 text-[11px]">no total</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2">
        {data.map((d, i) => (
          <li key={d.nome} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: PALETA[i % PALETA.length] }}
            />
            <span className="flex-1 font-medium">{d.nome}</span>
            <span className="text-texto-3 tabular-nums">
              {formatarDuracao(d.segundos)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------- barras horizontais ---------------------- */

export function BarrasTempo({
  dados,
}: {
  dados: { nome: string; segundos: number }[];
}) {
  const altura = Math.max(120, dados.length * 44);
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart
        data={dados}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
        barCategoryGap={10}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="nome"
          width={110}
          tick={{ fill: EIXO, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip cursor={{ fill: "var(--color-superficie-2)" }} content={<DicaTempo />} />
        <Bar dataKey="segundos" fill="var(--color-acento)" radius={[0, 6, 6, 0]} maxBarSize={22} isAnimationActive={false}>
          <LabelList
            dataKey="segundos"
            position="right"
            formatter={(v) => formatarDuracao(Number(v))}
            style={{ fill: EIXO, fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------------- atividade por mês ---------------------- */

export function BarrasMeses({
  dados,
}: {
  dados: { mes: string; videos: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dados} margin={{ top: 16, right: 8, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="mes"
          tick={{ fill: EIXO, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-borda-suave)" }}
        />
        <YAxis tick={{ fill: EIXO, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: "var(--color-superficie-2)" }} content={<DicaTempo sufixo="min" />} />
        <Bar dataKey="videos" fill="var(--color-acento)" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={false}>
          <LabelList dataKey="videos" position="top" style={{ fill: EIXO, fontSize: 11 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

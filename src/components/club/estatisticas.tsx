import Image from "next/image";
import { formatarDuracao } from "@/lib/format";
import {
  BarrasMeses,
  BarrasTempo,
  DonutTipo,
} from "@/components/graficos-estatisticas";
import type { EstatisticasDoTime } from "@/types/api";

const DIAS_SEMANA = [
  "domingos",
  "segundas",
  "terças",
  "quartas",
  "quintas",
  "sextas",
  "sábados",
];

const dataCurta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/**
 * `formatarDuracao` devolve string VAZIA para zero — o que faz sentido quando
 * a duração é um detalhe opcional ao lado de um título, mas não aqui: numa
 * coluna de horas, célula em branco parece dado faltando, e não "não assistiu".
 */
function duracao(segundos: number, vazio = "—") {
  return formatarDuracao(segundos) || vazio;
}

/**
 * Como o time usa a plataforma.
 *
 * O consumo (tipo, categoria, instrutor) aparece SOMADO; por pessoa aparece só
 * engajamento — horas, concluídos, última atividade. É de propósito: o dono
 * precisa saber quem está usando a licença, não o que cada um anda assistindo.
 */
export function EstatisticasDoClub({ dados }: { dados: EstatisticasDoTime }) {
  const t = dados.totais;
  const semAtividade = t.segundosAssistidos === 0 && t.videosConcluidos === 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cartao rotulo="Horas assistidas" valor={duracao(t.segundosAssistidos, "0 min")} />
        <Cartao rotulo="Vídeos concluídos" valor={String(t.videosConcluidos)} />
        <Cartao
          rotulo="Cursos finalizados"
          valor={String(t.cursosFinalizados)}
          nota="contados por pessoa"
        />
        <Cartao
          rotulo="Estudaram no período"
          valor={`${t.membrosAtivos} de ${dados.totalMembros}`}
        />
      </section>

      {semAtividade ? (
        <p className="border-borda bg-superficie text-texto-2 rounded-2xl border border-dashed p-6 text-center text-sm">
          Ninguém do time assistiu nada neste período. Troque o intervalo acima
          para olhar outra janela.
        </p>
      ) : (
        <>
          <Bloco titulo="Quem está usando">
            <ul className="divide-borda-suave divide-y">
              {dados.porMembro.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  {m.avatar ? (
                    <Image
                      src={m.avatar}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="bg-fundo-2 text-texto-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                      {m.nome.slice(0, 1).toUpperCase()}
                    </span>
                  )}

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-texto truncate text-sm font-medium">
                      {m.nome}
                    </span>
                    <span className="text-texto-3 truncate text-xs">
                      {m.ultimaAtividade
                        ? `${m.videosConcluidos} concluídos · último acesso em ${dataCurta.format(new Date(m.ultimaAtividade))}`
                        : "ainda não assistiu nada"}
                    </span>
                  </span>

                  <span className="text-texto shrink-0 text-sm font-semibold tabular-nums">
                    {duracao(m.segundos)}
                  </span>
                </li>
              ))}
            </ul>
          </Bloco>

          {dados.porTipo.length > 0 && (
            <Bloco titulo="O que o time assiste">
              <DonutTipo dados={dados.porTipo} />
            </Bloco>
          )}

          {dados.porCategoria.length > 0 && (
            <Bloco titulo="Assuntos mais vistos">
              <BarrasTempo
                dados={dados.porCategoria.map((c) => ({
                  nome: c.nome,
                  segundos: c.segundos,
                }))}
              />
            </Bloco>
          )}

          {dados.porInstrutor.length > 0 && (
            <Bloco titulo="Instrutores mais assistidos">
              <BarrasTempo
                dados={dados.porInstrutor.map((i) => ({
                  nome: i.nome,
                  segundos: i.segundos,
                }))}
              />
            </Bloco>
          )}

          {dados.porMes.length > 1 && (
            <Bloco titulo="Atividade por mês">
              <BarrasMeses
                dados={dados.porMes.map((m) => ({
                  mes: m.mes,
                  videos: m.videos,
                }))}
              />
            </Bloco>
          )}

          <p className="text-texto-3 text-sm">
            {t.diasComAtividade === 1
              ? "Houve atividade em 1 dia do período"
              : `Houve atividade em ${t.diasComAtividade} dias diferentes do período`}
            {dados.diaSemanaPico
              ? `, com mais movimento nas ${DIAS_SEMANA[dados.diaSemanaPico.dia]}`
              : ""}
            .
          </p>
        </>
      )}
    </div>
  );
}

function Cartao({
  rotulo,
  valor,
  nota,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div className="border-borda bg-superficie flex flex-col gap-0.5 rounded-2xl border p-4">
      <span className="font-display text-texto text-xl font-semibold tabular-nums">
        {valor}
      </span>
      <span className="text-texto-3 text-xs">{rotulo}</span>
      {nota && <span className="text-texto-3 text-[11px] italic">{nota}</span>}
    </div>
  );
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-borda bg-superficie flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      <h2 className="font-display text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { obterEstatisticasDetalhadas } from "@/lib/queries";
import { formatarDuracao, formatarData } from "@/lib/format";
import { FAIXA } from "@/lib/ui";
import {
  DonutTipo,
  BarrasTempo,
  BarrasMeses,
} from "@/components/graficos-estatisticas";
import { FiltroPeriodo } from "@/components/filtro-periodo";
import { EstadoVazio } from "@/components/estado-vazio";
import { IlustracaoSemEstatisticas } from "@/components/ilustracoes";
import type { EstatisticasDetalhadas } from "@/types/api";

export const metadata: Metadata = { title: "Minhas estatísticas" };

const DIAS_SEMANA = [
  "domingos",
  "segundas",
  "terças",
  "quartas",
  "quintas",
  "sextas",
  "sábados",
];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function rotuloMes(iso: string) {
  const [, mes] = iso.split("-");
  return MESES[Number(mes) - 1] ?? iso;
}

export default async function PaginaEstatisticas({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; todo?: string }>;
}) {
  const sp = await searchParams;
  const semLimite = sp.todo === "1";
  let de = sp.de;
  let ate = sp.ate;
  // Período padrão: últimos 30 dias — a menos que seja "Todo o período" (?todo=1)
  // ou um intervalo explícito na URL.
  if (!semLimite && !(de && ate)) {
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 29);
    de = fmt(inicio);
    ate = fmt(hoje);
  }
  const comFiltro = !semLimite;
  const s = await obterEstatisticasDetalhadas(
    semLimite ? undefined : de,
    semLimite ? undefined : ate,
  );

  if (!s) {
    return (
      <div className={`${FAIXA} mx-auto max-w-3xl py-16 text-center`}>
        <p className="text-texto font-semibold">
          Não foi possível carregar suas estatísticas.
        </p>
        <p className="text-texto-3 mt-1 text-sm">Recarregue a página em instantes.</p>
      </div>
    );
  }

  const semAtividade = s.videosConcluidos === 0 && s.segundosAssistidos === 0;

  return (
    <div className={`${FAIXA} flex flex-1 flex-col gap-10 py-8 sm:py-10`}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
            Minhas estatísticas
          </h1>
          <p className="text-texto-3 text-sm">
            {comFiltro
              ? "Métricas do período selecionado."
              : s.membroDesde
                ? `Sua jornada na plataforma desde ${formatarData(s.membroDesde)}.`
                : "Sua jornada na plataforma."}
          </p>
        </div>
        <div className="shrink-0">
          <span className="text-texto-3 mb-1.5 block text-right text-[11px] font-semibold tracking-wider uppercase">
            Período
          </span>
          <FiltroPeriodo
            de={semLimite ? undefined : de}
            ate={semLimite ? undefined : ate}
            todo={semLimite}
          />
        </div>
      </header>

      {/*
        Único estado vazio da plataforma que mantém o cabeçalho: o filtro de
        período mora nele e é justamente a saída do caso "nada NESTE período".
        Por isso `nivel="secao"` — o <h1> da página já está logo acima.
      */}
      {semAtividade ? (
        <EstadoVazio
          nivel="secao"
          ilustracao={<IlustracaoSemEstatisticas />}
          titulo={
            comFiltro
              ? "Nada registrado neste período"
              : "Suas estatísticas começam na primeira aula"
          }
          descricao={
            comFiltro
              ? "Você não assistiu nada no intervalo selecionado. Experimente um intervalo maior — ou veja tudo desde o começo."
              : "Assim que você assistir, aparecem aqui seu tempo de estudo, as áreas que mais estuda, os instrutores que mais acompanha e as conquistas que for somando."
          }
        >
          {comFiltro ? (
            <Link
              href="/estatisticas?todo=1"
              className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-colors"
            >
              Ver todo o período
            </Link>
          ) : (
            <Link
              href="/inicio"
              className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-colors"
            >
              Explorar o catálogo
            </Link>
          )}
        </EstadoVazio>
      ) : (
        <>
          {/* Panorama */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Cartao valor={formatarDuracao(s.segundosAssistidos) || "0 min"} rotulo="Tempo assistido" />
            <Cartao valor={String(s.videosConcluidos)} rotulo="Aulas concluídas" />
            <Cartao valor={String(s.cursosFinalizados)} rotulo="Cursos finalizados" />
            <Cartao valor={String(s.conteudosEmAndamento)} rotulo="Em andamento" />
            <Cartao valor={String(s.diasAtivos)} rotulo="Dias ativos" />
            <Cartao
              valor={s.diaSemanaPico ? DIAS_SEMANA[s.diaSemanaPico.dia] : "—"}
              rotulo="Dia que mais assiste"
            />
            <Cartao
              valor={s.ultimaAtividade ? formatarData(s.ultimaAtividade) : "—"}
              rotulo="Última atividade"
            />
            <Cartao valor={s.membroDesde ? formatarData(s.membroDesde) : "—"} rotulo="Membro desde" />
          </section>

          {/* Consumo: tipo (donut) + áreas (barras) */}
          <div className="grid gap-6 lg:grid-cols-2">
            {s.porTipo.length > 0 && (
              <Secao titulo="Por tipo de conteúdo">
                <DonutTipo dados={s.porTipo} />
              </Secao>
            )}
            {s.porCategoria.length > 0 && (
              <Secao titulo="Áreas que você mais estuda">
                <BarrasTempo
                  dados={s.porCategoria.map((c) => ({ nome: c.nome, segundos: c.segundos }))}
                />
              </Secao>
            )}
          </div>

          {/* Instrutores */}
          {s.porInstrutor.length > 0 && (
            <Secao titulo="Instrutores que você mais assiste">
              <ListaInstrutores itens={s.porInstrutor} />
            </Secao>
          )}

          {/* Atividade no tempo */}
          {s.porMes.length > 0 && (
            <Secao
              titulo="Sua atividade"
              descricao={
                s.diaSemanaPico
                  ? `Você costuma assistir mais às ${DIAS_SEMANA[s.diaSemanaPico.dia]}.`
                  : undefined
              }
            >
              <BarrasMeses
                dados={s.porMes.map((m) => ({ mes: rotuloMes(m.mes), videos: m.videos }))}
              />
            </Secao>
          )}

          {/* Coleções */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Cartao valor={String(s.listasCriadas)} rotulo="Listas criadas" />
            <Cartao valor={String(s.salvos)} rotulo="Salvos" />
            <Cartao valor={String(s.avaliacoesFeitas)} rotulo="Avaliações feitas" />
            <Cartao
              valor={s.mediaNotasDadas != null ? `${s.mediaNotasDadas} ★` : "—"}
              rotulo="Média das suas notas"
            />
          </section>

          {/* Conquistas */}
          <Secao titulo="Conquistas">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {conquistas(s).map((c) => (
                <li
                  key={c.titulo}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center ${
                    c.ok
                      ? "border-acento/40 bg-acento/5"
                      : "border-borda-suave bg-superficie opacity-55"
                  }`}
                >
                  <span className={`text-2xl ${c.ok ? "" : "grayscale"}`}>{c.emoji}</span>
                  <span className="text-xs font-semibold leading-tight">{c.titulo}</span>
                  {!c.ok && <span className="text-texto-3 text-[10px]">{c.falta}</span>}
                </li>
              ))}
            </ul>
          </Secao>
        </>
      )}
    </div>
  );
}

/* ---------------------------- componentes ---------------------------- */

function Cartao({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="border-borda-suave bg-superficie flex flex-col gap-1 rounded-xl border p-4">
      <span className="font-display text-lg font-semibold tabular-nums text-balance sm:text-xl">
        {valor}
      </span>
      <span className="text-texto-3 text-xs">{rotulo}</span>
    </div>
  );
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-borda-suave bg-superficie flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-lg font-semibold">{titulo}</h2>
        {descricao && <p className="text-texto-3 text-sm">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

function ListaInstrutores({
  itens,
}: {
  itens: EstatisticasDetalhadas["porInstrutor"];
}) {
  const max = Math.max(...itens.map((i) => i.segundos), 1);
  return (
    <ul className="flex flex-col gap-4">
      {itens.map((i, idx) => (
        <li key={`${i.nome}-${idx}`} className="flex items-center gap-3">
          <span className="bg-superficie-2 relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
            {i.avatar ? (
              <Image
                src={i.avatar}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <span className="bg-acento/15 text-acento flex h-full w-full items-center justify-center text-sm font-bold">
                {iniciais(i.nome)}
              </span>
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium">{i.nome}</span>
              <span className="text-texto-3 shrink-0 text-xs tabular-nums">
                {formatarDuracao(i.segundos)}
              </span>
            </div>
            <div className="bg-superficie-2 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-acento h-full rounded-full"
                style={{ width: `${Math.round((i.segundos / max) * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/* ---------------------------- conquistas ---------------------------- */

function conquistas(s: EstatisticasDetalhadas) {
  return [
    { emoji: "🎬", titulo: "Primeira aula", ok: s.videosConcluidos >= 1, falta: "assista 1 aula" },
    { emoji: "🔟", titulo: "10 aulas", ok: s.videosConcluidos >= 10, falta: `faltam ${Math.max(0, 10 - s.videosConcluidos)}` },
    { emoji: "🎓", titulo: "Primeiro curso", ok: s.cursosFinalizados >= 1, falta: "conclua 1 curso" },
    { emoji: "🏆", titulo: "5 cursos", ok: s.cursosFinalizados >= 5, falta: `faltam ${Math.max(0, 5 - s.cursosFinalizados)}` },
    { emoji: "⏱️", titulo: "1 hora assistida", ok: s.segundosAssistidos >= 3600, falta: "assista 1h" },
    { emoji: "📚", titulo: "10 horas", ok: s.segundosAssistidos >= 36000, falta: "assista 10h" },
    { emoji: "📝", titulo: "Primeira lista", ok: s.listasCriadas >= 1, falta: "crie 1 lista" },
    { emoji: "⭐", titulo: "Primeira avaliação", ok: s.avaliacoesFeitas >= 1, falta: "avalie 1 aula" },
  ];
}

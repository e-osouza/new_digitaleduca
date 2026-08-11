import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { perfilInstrutor } from "@/lib/queries";
import { ROTULOS_PLURAIS, TIPOS_NA_URL } from "@/lib/nav";
import { resumir } from "@/lib/format";
import { CardConteudo } from "@/components/card-conteudo";
import { Paginacao } from "@/components/paginacao";
import type { TipoConteudo } from "@/types/api";

const POR_PAGINA = 12;

const FILTROS: { rotulo: string; valor?: TipoConteudo }[] = [
  { rotulo: "Tudo" },
  ...Object.values(TIPOS_NA_URL).map((valor) => ({
    rotulo: ROTULOS_PLURAIS[valor],
    valor,
  })),
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const perfil = await perfilInstrutor(Number(id), { limit: 1 });
  return {
    title: perfil?.instrutor?.nome ?? "Instrutor",
    description: resumir(perfil?.instrutor?.sobre ?? null, 155),
  };
}

export default async function PaginaInstrutor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string; pagina?: string }>;
}) {
  const [{ id }, { tipo, pagina }] = await Promise.all([params, searchParams]);

  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) notFound();

  const tipoValido = FILTROS.find((f) => f.valor === tipo)?.valor;
  const paginaAtual = Math.max(1, Number(pagina) || 1);

  const perfil = await perfilInstrutor(numero, {
    tipo: tipoValido,
    page: paginaAtual,
    limit: POR_PAGINA,
  });

  if (!perfil?.instrutor) notFound();

  const { instrutor, data: conteudos = [], pagination } = perfil;
  const totalPaginas = pagination?.totalPages ?? 1;

  return (
    <div className="calha flex w-full flex-col gap-8 py-8 sm:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="border-borda bg-superficie relative h-24 w-24 shrink-0 overflow-hidden rounded-full border sm:h-28 sm:w-28">
          {instrutor.avatar ? (
            <Image
              src={instrutor.avatar}
              alt=""
              fill
              priority
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <span className="text-texto-3 flex h-full items-center justify-center text-3xl font-semibold">
              {instrutor.nome.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {instrutor.nome}
          </h1>
          {instrutor.formacao && (
            <p className="text-acento text-sm font-medium">{instrutor.formacao}</p>
          )}
          {instrutor.sobre && (
            <p className="text-texto-2 max-w-2xl leading-relaxed">
              {instrutor.sobre}
            </p>
          )}
          {typeof instrutor.totalConteudos === "number" && (
            <p className="text-texto-3 text-sm tabular-nums">
              {instrutor.totalConteudos}{" "}
              {instrutor.totalConteudos === 1 ? "conteúdo" : "conteúdos"} na
              plataforma
            </p>
          )}
        </div>
      </header>

      <div className="trilho -mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {FILTROS.map((filtro) => {
          const ativo = filtro.valor === tipoValido;
          const parametros = new URLSearchParams();
          if (filtro.valor) parametros.set("tipo", filtro.valor);
          const consulta = parametros.toString();

          return (
            <Link
              key={filtro.rotulo}
              href={`/instrutor/${numero}${consulta ? `?${consulta}` : ""}`}
              className={`flex min-h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-200 ${
                ativo
                  ? "border-acento bg-acento text-fundo"
                  : "border-borda bg-superficie text-texto-2 hover:border-acento/60 hover:bg-superficie-2 hover:text-texto"
              }`}
            >
              {filtro.rotulo}
            </Link>
          );
        })}
      </div>

      {conteudos.length === 0 ? (
        <p className="text-texto-3 text-sm">
          Nenhum conteúdo deste instrutor nesta seleção.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {conteudos.map((conteudo) => (
            <CardConteudo
              key={conteudo.id}
              conteudo={conteudo}
              largura="w-full"
            />
          ))}
        </div>
      )}

      <Paginacao
        base={`/instrutor/${numero}`}
        pagina={paginaAtual}
        totalPaginas={totalPaginas}
        parametros={{ tipo: tipoValido }}
      />

    </div>
  );
}

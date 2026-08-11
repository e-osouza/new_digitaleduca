import Image from "next/image";
import Link from "next/link";
import {
  arvoreFreemium,
  emAndamento,
  listarConteudos,
  listarInstrutores,
  listarTop10,
  paraCard,
} from "@/lib/queries";
import {
  capaDoConteudo,
  duracaoTotal,
  formatarDuracao,
  resumir,
  rotuloTipo,
} from "@/lib/format";
import { CardConteudo } from "@/components/card-conteudo";
import { Trilho } from "@/components/trilho";
import { Selo } from "@/components/selo";
import type { Conteudo } from "@/types/api";

/** Home de quem já entrou: catálogo completo em trilhos. */
export async function Catalogo() {
  const [destaques, top10Aulas, top10Podcasts, freemium, instrutores] =
    await Promise.all([
      listarConteudos({ destaque: true, limit: 12 }),
      listarTop10({ tipo: "AULA" }),
      listarTop10({ tipo: "PODCAST" }),
      arvoreFreemium(),
      listarInstrutores(14),
    ]);

  // Já vem com título, capas e duração — sem precisar cruzar com o catálogo.
  const continuar = await emAndamento(10);

  const heroi = destaques.data[0] ?? top10Aulas.data[0] ?? null;
  const outrosDestaques = destaques.data.slice(1);

  const faixasGratuitas = freemium
    .map((categoria) => ({
      id: categoria.id,
      nome: categoria.categoria,
      conteudos: categoria.subcategorias.flatMap((sub) => sub.conteudos),
    }))
    .filter((faixa) => faixa.conteudos.length > 0);

  return (
    <div className="flex flex-col gap-10 pb-8 sm:gap-14">
      {heroi && <HeroiCatalogo conteudo={heroi} />}

      {continuar.length > 0 && (
        <Trilho
          titulo="Continue de onde parou"
          verMais={{ href: "/meus-conteudos", rotulo: "Ver tudo" }}
        >
          {continuar.map((item) => (
            <CardConteudo
              key={item.conteudoId}
              conteudo={paraCard(item)}
              progresso={item.percentualAssistido}
              duracaoSegundos={item.duracao}
            />
          ))}
        </Trilho>
      )}

      {outrosDestaques.length > 0 && (
        <Trilho titulo="Em destaque" descricao="Selecionados pela curadoria">
          {outrosDestaques.map((conteudo) => (
            <CardConteudo key={conteudo.id} conteudo={conteudo} />
          ))}
        </Trilho>
      )}

      {top10Aulas.data.length > 0 && (
        <Trilho titulo="Aulas mais assistidas">
          {top10Aulas.data.map((conteudo) => (
            <CardConteudo key={conteudo.id} conteudo={conteudo} />
          ))}
        </Trilho>
      )}

      {faixasGratuitas.map((faixa) => (
        <Trilho key={faixa.id} titulo={faixa.nome}>
          {faixa.conteudos.map((conteudo) => (
            <CardConteudo key={conteudo.id} conteudo={conteudo} />
          ))}
        </Trilho>
      ))}

      {top10Podcasts.data.length > 0 && (
        <Trilho titulo="Podcasts" descricao="Conversas com quem faz acontecer">
          {top10Podcasts.data.map((conteudo) => (
            <CardConteudo key={conteudo.id} conteudo={conteudo} />
          ))}
        </Trilho>
      )}

      {instrutores.length > 0 && (
        <Trilho titulo="Especialistas" descricao="Quem ensina na plataforma">
          {instrutores.map((instrutor) => (
            <Link
              key={instrutor.id}
              href={`/instrutor/${instrutor.id}`}
              className="border-borda-suave bg-superficie hover:border-acento/60 ease-suave flex w-52 shrink-0 flex-col items-center gap-3 rounded-xl border p-5 text-center transition-[border-color,transform] duration-200 active:scale-[0.98]"
            >
              <div className="bg-superficie-2 relative h-20 w-20 overflow-hidden rounded-full">
                {instrutor.avatar ? (
                  <Image
                    src={instrutor.avatar}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-texto-3 flex h-full items-center justify-center text-xl font-semibold">
                    {instrutor.nome.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">{instrutor.nome}</p>
                {instrutor.formacao && (
                  <p className="text-texto-3 line-clamp-3 text-xs leading-snug">
                    {instrutor.formacao}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </Trilho>
      )}
    </div>
  );
}

function HeroiCatalogo({ conteudo }: { conteudo: Conteudo }) {
  const capa = conteudo.thumbnailDestaque ?? capaDoConteudo(conteudo);
  const duracao = duracaoTotal(conteudo);
  const instrutor = conteudo.instrutores?.[0]?.instrutor;

  return (
    <section className="relative min-h-[340px] overflow-hidden sm:min-h-[420px] lg:min-h-[500px]">
      {capa && (
        <Image
          src={capa}
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-surgir object-cover object-center"
        />
      )}
      <div className="veu-heroi absolute inset-0" />

      <div className="calha relative flex w-full flex-col justify-end gap-4 pt-20 pb-10 sm:gap-5 sm:pt-24 sm:pb-12">
        <div className="flex flex-wrap items-center gap-2">
          <Selo variacao="acento">{rotuloTipo(conteudo.tipo)}</Selo>
          {conteudo.level && <Selo>{conteudo.level}</Selo>}
          {duracao > 0 && <Selo>{formatarDuracao(duracao)}</Selo>}
        </div>

        <h1 className="font-display max-w-3xl text-2xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          {conteudo.titulo}
        </h1>

        {conteudo.descricao && (
          <p className="text-texto-2 line-clamp-3 max-w-xl text-sm leading-relaxed sm:line-clamp-none sm:text-base">
            {resumir(conteudo.descricao, 220)}
          </p>
        )}

        {instrutor && (
          <p className="text-texto-3 text-sm">
            com <span className="text-texto-2 font-medium">{instrutor.nome}</span>
          </p>
        )}

        <div className="pt-1">
          <Link
            href={`/conteudo/${conteudo.id}`}
            className="bg-acento text-fundo hover:bg-acento-hover ease-suave inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-bold transition-all duration-200 hover:gap-3 active:scale-95"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="currentColor">
              <path d="M4 2.5v11l9-5.5-9-5.5Z" />
            </svg>
            Assistir agora
          </Link>
        </div>
      </div>
    </section>
  );
}


import Link from "next/link";
import { FAIXA } from "@/lib/ui";

const BENEFICIOS = [
  "Acervo completo de cursos, palestras e podcasts",
  "Conteúdos novos toda quinzena",
  "Trilhas montadas para o seu objetivo",
  "Acesso pelo navegador e pelos aplicativos",
];

/**
 * Tela mostrada quando a API recusa a reprodução por falta de assinatura.
 *
 * É um ponto de conversão, não uma página de erro: em vez de apenas informar o
 * bloqueio, mostra o que a assinatura inclui e leva aos planos. Por isso o
 * cartão é centrado e fechado — o layout anterior alinhava tudo à esquerda numa
 * coluna estreita, deixando dois terços da tela vazios à direita.
 */
export function SemAcesso({
  voltarPara,
  conteudoId,
  titulo = "Conteúdo exclusivo para assinantes",
}: {
  voltarPara?: string;
  /** Preenche o retorno e leva o contexto para a página de planos. */
  conteudoId?: number;
  titulo?: string;
}) {
  const destinoVoltar = voltarPara ?? (conteudoId ? `/conteudo/${conteudoId}` : "/inicio");
  const destinoPlanos = conteudoId ? `/planos?conteudo=${conteudoId}` : "/planos";

  return (
    <div className={`${FAIXA} flex justify-center py-10 sm:py-16`}>
      <div className="border-borda-suave bg-superficie relative w-full max-w-lg overflow-hidden rounded-2xl border text-center shadow-sm">
        {/* Faixa da marca no topo, para o cartão não começar seco. */}
        <div className="from-acento/25 via-acento/10 relative flex justify-center bg-gradient-to-b to-transparent px-6 pt-10 pb-2">
          <span className="bg-acento text-white ring-superficie flex h-16 w-16 items-center justify-center rounded-2xl ring-8">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="8.5" width="12" height="8" rx="2" />
              <path d="M6.75 8.5V6a3.25 3.25 0 0 1 6.5 0v2.5" />
            </svg>
          </span>
        </div>

        <div className="flex flex-col items-center gap-6 px-6 pt-6 pb-8 sm:px-10 sm:pb-10">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-balance">
              {titulo}
            </h1>
            <p className="text-texto-2 text-sm leading-relaxed text-pretty">
              Este item faz parte do acervo premium. Assine para liberar a
              reprodução — e continuar de onde parou em qualquer aparelho.
            </p>
          </div>

          <ul className="border-borda-suave flex w-full flex-col gap-2.5 border-y py-5 text-left">
            {BENEFICIOS.map((beneficio) => (
              <li
                key={beneficio}
                className="text-texto-2 flex items-start gap-2.5 text-sm leading-snug"
              >
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="text-acento mt-0.5 h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m4.5 10.5 3.5 3.5 7.5-8" />
                </svg>
                {beneficio}
              </li>
            ))}
          </ul>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href={destinoPlanos}
              className="bg-acento text-white hover:bg-acento-hover flex min-h-12 flex-1 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors"
            >
              Ver planos
            </Link>
            <Link
              href={destinoVoltar}
              className="border-borda bg-superficie text-texto hover:border-acento/60 hover:bg-superficie-2 flex min-h-12 flex-1 items-center justify-center rounded-full border px-6 text-sm font-semibold transition-colors"
            >
              Voltar
            </Link>
          </div>

          <p className="text-texto-3 text-sm">
            Procurando algo grátis?{" "}
            <Link
              href="/inicio"
              className="text-acento hover:text-acento-claro font-semibold"
            >
              Veja o que está liberado
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

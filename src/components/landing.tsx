import Image from "next/image";
import Link from "next/link";
import { listarConteudos, listarInstrutores, listarPlanos } from "@/lib/queries";
import { formatarPreco } from "@/lib/format";
import { CardConteudo } from "@/components/card-conteudo";

/** Preço "de" exibido na tabela do site institucional. */
const PRECO_CHEIO = 149;

const BENEFICIOS = [
  {
    icone: "/icon-user.svg",
    titulo: "Aprenda com profissionais",
    complemento: "que atuam no mercado.",
  },
  {
    icone: "/icon-check.svg",
    titulo: "Mantenha-se sempre atualizado",
    complemento: "com assinatura recorrente.",
  },
  {
    icone: "/icon-school.svg",
    titulo: "Estude em aulas 100% online,",
    complemento: "no seu ritmo.",
  },
];

const DIFERENCIAIS = [
  "Conteúdo para empresários e líderes que querem destravar resultados",
  "Replays do DSX e entrevistas exclusivas",
  "Cursos e super aulas quinzenais com mentores de mercado",
  "Especialistas que já ajudaram empresas a escalar e se manter competitivas",
];

const DUVIDAS = [
  {
    pergunta: "Como acesso a plataforma?",
    resposta:
      "Depois de assinar, você entra com seu e-mail e senha aqui mesmo, pelo navegador, ou pelos aplicativos para Android e iOS. O progresso é sincronizado entre os dispositivos.",
  },
  {
    pergunta: "O que está incluso na assinatura?",
    resposta:
      "Todo o acervo: cursos, super aulas quinzenais, replays do DSX e entrevistas exclusivas com especialistas de mercado. Conteúdos novos entram sem custo adicional.",
  },
  {
    pergunta: "O acesso é vitalício?",
    resposta:
      "O acesso vale enquanto a assinatura estiver ativa. Você pode cancelar quando quiser e continua com acesso até o fim do período já pago.",
  },
  {
    pergunta: "Existem aulas ao vivo?",
    resposta:
      "O acervo é sob demanda, para você estudar no seu ritmo. Encontros e imersões especiais são anunciados aos assinantes ao longo do ano.",
  },
];

export async function Landing() {
  const [vitrine, instrutores, planos] = await Promise.all([
    listarConteudos({ destaque: true, limit: 6 }),
    listarInstrutores(6),
    listarPlanos(),
  ]);

  const mensal =
    planos.find((p) => p.intervalo === "month" && p.preco > 0) ??
    planos.find((p) => p.preco > 0) ??
    null;

  return (
    <div className="flex flex-col">
      <Heroi />
      <Beneficios />
      <Vitrine conteudos={vitrine.data} />
      <Especialistas instrutores={instrutores} />
      <Metodo />
      <Diferenciais />
      {mensal && <Planos plano={mensal} />}
      <Duvidas />
      <ChamadaFinal />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Heroi() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="aura-acento pointer-events-none absolute inset-x-0 top-0 h-[560px]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:pt-24 lg:pb-28">
        <div className="flex flex-col items-start gap-6">
          <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Digital Educa é o próximo passo para{" "}
            <span className="text-acento">Destravar Resultados</span>
          </h1>

          <p className="text-texto-2 max-w-lg text-base leading-relaxed sm:text-lg">
            Sua plataforma de educação corporativa com cursos, palestras e
            conteúdos exclusivos.
          </p>

          <Link
            href="/cadastro"
            className="bg-acento text-fundo hover:bg-acento-hover rounded-full px-8 py-4 text-sm font-bold transition-colors sm:text-base"
          >
            Comece agora mesmo
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <Image
            src="/rocket_img.png"
            alt=""
            width={720}
            height={720}
            priority
            className="h-auto w-full object-contain"
          />
        </div>
      </div>
    </section>
  );
}

function Beneficios() {
  return (
    <section className="border-borda-suave border-y">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-3 sm:px-8 lg:px-10">
        {BENEFICIOS.map((beneficio) => (
          <div key={beneficio.titulo} className="flex items-start gap-4">
            <Image
              src={beneficio.icone}
              alt=""
              width={40}
              height={40}
              className="mt-0.5 h-10 w-10 shrink-0"
            />
            <p className="text-sm leading-snug">
              <span className="text-texto font-semibold">{beneficio.titulo}</span>
              <br />
              <span className="text-texto-2">{beneficio.complemento}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Vitrine({
  conteudos,
}: {
  conteudos: Awaited<ReturnType<typeof listarConteudos>>["data"];
}) {
  if (conteudos.length === 0) return null;

  return (
    <section
      id="conteudos"
      className="mx-auto flex w-full max-w-7xl scroll-mt-20 flex-col gap-8 px-5 py-20 sm:px-8 lg:px-10"
    >
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          Construa <span className="text-acento">estratégias sólidas</span> para o
          seu negócio
        </h2>
        <p className="text-texto-2 max-w-xl">
          Cursos para dominar vendas, marketing, gestão e inovação.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-3">
        {conteudos.map((conteudo) => (
          <CardConteudo
            key={conteudo.id}
            conteudo={conteudo}
            largura="w-full"
            href={`/entrar?proximo=/conteudo/${conteudo.id}`}
            bloqueado
          />
        ))}
      </div>

      <p className="text-texto-3 text-sm">
        Entre na plataforma para ver o acervo completo.{" "}
        <Link href="/entrar" className="text-acento hover:text-acento-claro font-semibold">
          Fazer login
        </Link>
      </p>
    </section>
  );
}

function Especialistas({
  instrutores,
}: {
  instrutores: Awaited<ReturnType<typeof listarInstrutores>>;
}) {
  if (instrutores.length === 0) return null;

  return (
    <section className="bg-fundo-2 border-borda-suave border-y">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-20 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Viva uma imersão nas{" "}
            <span className="text-acento">ideias que lideram o mercado</span>
          </h2>
          <p className="text-texto-2 max-w-xl">
            Conteúdos inéditos com especialistas que revelam bastidores e
            tendências.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {instrutores.map((instrutor) => (
            <div key={instrutor.id} className="flex flex-col items-center gap-3 text-center">
              <div className="border-borda bg-superficie relative h-24 w-24 overflow-hidden rounded-full border">
                {instrutor.avatar ? (
                  <Image
                    src={instrutor.avatar}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-texto-3 flex h-full items-center justify-center text-2xl font-semibold">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metodo() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10">
      <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
        Método <span className="text-acento">Digital Educa</span>
      </h2>

      <div className="text-texto-2 flex flex-col gap-5 leading-relaxed">
        <p>
          Nossa metodologia é baseada em educação corporativa prática e orientada
          a resultados. Combinamos conteúdo estratégico, aplicabilidade e
          experiências de mercado, para que o aprendizado gere transformação
          concreta nos negócios.
        </p>
        <p>
          O Digital Educa integra conceitos de aprendizagem ativa e atualização
          contínua, garantindo que empreendedores, líderes e equipes desenvolvam
          competências essenciais em gestão, vendas, marketing e inovação.
        </p>
        <Link
          href="/cadastro"
          className="border-borda bg-superficie hover:border-acento hover:text-acento w-fit rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
        >
          Comece agora
        </Link>
      </div>
    </section>
  );
}

function Diferenciais() {
  return (
    <section className="bg-fundo-2 border-borda-suave border-y">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-20 sm:px-8 lg:px-10">
        <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          Por que a Digital Educa é para{" "}
          <span className="text-acento">você?</span>
        </h2>

        <ul className="grid gap-4 sm:grid-cols-2">
          {DIFERENCIAIS.map((item) => (
            <li
              key={item}
              className="border-borda-suave bg-superficie flex items-start gap-3 rounded-xl border p-5"
            >
              <span aria-hidden="true" className="text-acento mt-0.5 shrink-0 font-bold">
                ✓
              </span>
              <span className="text-texto-2 text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Planos({
  plano,
}: {
  plano: NonNullable<Awaited<ReturnType<typeof listarPlanos>>[number]>;
}) {
  return (
    <section
      id="planos"
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8 lg:px-10"
    >
      <div className="flex flex-col gap-3 pb-10">
        <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          Plano único, <span className="text-acento">acesso total</span>
        </h2>
        <p className="text-texto-2 max-w-xl">
          Tudo o que você precisa para acelerar sua evolução em um só lugar.
        </p>
      </div>

      <div className="border-acento/40 bg-superficie mx-auto flex max-w-md flex-col gap-6 rounded-2xl border p-8">
        <div className="flex flex-col gap-1">
          <span className="text-acento text-xs font-semibold tracking-wider uppercase">
            Plano {plano.nome}
          </span>
          <div className="flex items-end gap-3">
            <span className="text-texto-3 pb-1 text-sm line-through">
              {formatarPreco(PRECO_CHEIO)}
            </span>
            <span className="font-display text-4xl font-semibold tracking-tight">
              {formatarPreco(plano.preco)}
            </span>
          </div>
          <span className="text-texto-3 text-sm">por mês</span>
        </div>

        <ul className="flex flex-col gap-2.5">
          {[
            "Acervo completo de cursos e super aulas",
            "Replays do DSX",
            "Entrevistas exclusivas",
            "Acesso pelo navegador e pelos apps",
          ].map((item) => (
            <li key={item} className="text-texto-2 flex items-start gap-2.5 text-sm">
              <span aria-hidden="true" className="text-acento shrink-0">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/cadastro"
          className="bg-acento text-fundo hover:bg-acento-hover rounded-full px-6 py-3.5 text-center text-sm font-bold transition-colors"
        >
          Assine agora
        </Link>

        <p className="text-texto-3 text-center text-xs">
          Segurança de 7 dias para testes.
        </p>
      </div>
    </section>
  );
}

function Duvidas() {
  return (
    <section className="bg-fundo-2 border-borda-suave border-y">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-20 sm:px-8 lg:px-10">
        <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          Ainda tem dúvidas?
        </h2>

        <div className="flex flex-col gap-3">
          {DUVIDAS.map((duvida) => (
            <details
              key={duvida.pergunta}
              className="border-borda-suave bg-superficie group rounded-xl border"
            >
              <summary className="hover:text-acento cursor-pointer px-5 py-4 text-sm font-semibold transition-colors">
                {duvida.pergunta}
              </summary>
              <p className="text-texto-2 px-5 pb-4 text-sm leading-relaxed">
                {duvida.resposta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChamadaFinal() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-5 py-20 text-center sm:px-8 lg:px-10">
      <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
        Destrave o crescimento do seu negócio
      </h2>
      <p className="text-texto-2 max-w-lg">
        Conteúdos estratégicos e práticos, com quem já ajudou empresas a escalar.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/cadastro"
          className="bg-acento text-fundo hover:bg-acento-hover rounded-full px-8 py-4 text-sm font-bold transition-colors"
        >
          Quero assinar
        </Link>
        <Link
          href="/entrar"
          className="border-borda bg-superficie hover:border-acento hover:text-acento rounded-full border px-8 py-4 text-sm font-semibold transition-colors"
        >
          Já sou assinante
        </Link>
      </div>
    </section>
  );
}

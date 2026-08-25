"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo, Nota } from "@/components/campo";
import type { MeuTime } from "@/types/api";

const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/**
 * O time do dono do Club: quem já está dentro, quem foi convidado e o que
 * sobra de vaga.
 *
 * Não há datas por membro de propósito. O acesso de quem está no time é o
 * acesso do dono, resolvido a cada requisição — enquanto o Club dele valer,
 * o time vê tudo; quando acabar, todo mundo perde junto, sem nada para
 * atualizar aqui.
 */
export function TimeDoClub({ time }: { time: MeuTime }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [linkNovo, setLinkNovo] = useState<{ nome: string; url: string } | null>(
    null,
  );
  const [copiado, setCopiado] = useState(false);

  const semVaga = time.vagasRestantes <= 0;

  async function convidar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setLinkNovo(null);
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    const formulario = evento.currentTarget;

    const resposta = await fetch("/api/club/time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: String(dados.get("nome") ?? "").trim(),
        email: String(dados.get("email") ?? "").trim(),
      }),
    });

    const corpo = await resposta.json().catch(() => ({}));
    setEnviando(false);

    if (!resposta.ok) {
      setErro(corpo.erro ?? "Não foi possível convidar agora.");
      return;
    }

    formulario.reset();

    /*
      Quando o e-mail não sai (SMTP fora do ar, por exemplo), o convite existe
      igual e só falta chegar até a pessoa. Mostrar o link aqui é o que impede
      a funcionalidade de morrer junto com o servidor de e-mail.
    */
    if (!corpo.emailEnviado) {
      setLinkNovo({
        nome: corpo.nome,
        url: `${window.location.origin}/convite/${corpo.token}`,
      });
    }

    router.refresh();
  }

  async function apagar(url: string, chave: string, pergunta: string) {
    if (!confirm(pergunta)) return;

    setErro("");
    setOcupado(chave);

    const resposta = await fetch(url, { method: "DELETE" });
    const corpo = await resposta.json().catch(() => ({}));

    setOcupado(null);

    if (!resposta.ok) {
      setErro(corpo.erro ?? "Não foi possível concluir agora.");
      return;
    }

    router.refresh();
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="border-borda bg-superficie flex flex-col gap-5 rounded-2xl border p-5 sm:p-6">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-semibold">Seu time</h2>
          <p className="text-texto-3 text-sm tabular-nums">
            {time.vagasUsadas} de {time.limite} vagas em uso
          </p>
        </header>

        <p className="text-texto-2 text-sm">
          Quem entra no seu time vê todo o conteúdo da plataforma enquanto sua
          participação no Club estiver ativa.
        </p>

        {erro && <Aviso>{erro}</Aviso>}

        {linkNovo && (
          <Nota>
            <span className="flex flex-col gap-2">
              <span>
                O convite de <strong>{linkNovo.nome}</strong> foi criado, mas o
                e-mail não pôde ser enviado. Entregue este link:
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <code className="bg-fundo-2 text-texto-2 min-w-0 flex-1 truncate rounded px-2 py-1.5 text-xs">
                  {linkNovo.url}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(linkNovo.url);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  }}
                  className="border-borda text-texto-2 hover:text-texto shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  {copiado ? "Copiado" : "Copiar"}
                </button>
              </span>
            </span>
          </Nota>
        )}

        {semVaga ? (
          <p className="border-borda bg-fundo-2 text-texto-2 rounded-lg border border-dashed p-4 text-sm">
            Suas {time.limite} vagas estão ocupadas. Para chamar mais alguém,
            tire alguém do time ou cancele um convite.
          </p>
        ) : (
          <form onSubmit={convidar} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                id="nome"
                name="nome"
                rotulo="Nome"
                required
                maxLength={120}
                placeholder="Maria Souza"
              />
              <Campo
                id="email"
                name="email"
                type="email"
                rotulo="E-mail"
                required
                placeholder="maria@empresa.com.br"
                dica="Se já houver conta com este e-mail, ela entra no time no aceite."
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="bg-acento text-white hover:bg-acento-hover flex min-h-12 w-fit items-center rounded-full px-7 text-sm font-bold transition-colors disabled:opacity-60"
            >
              {enviando ? "Convidando…" : "Convidar"}
            </button>
          </form>
        )}
      </div>

      {time.membros.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-texto-2 text-sm font-semibold">
            No time ({time.membros.length})
          </h3>
          <ul className="border-borda divide-borda bg-superficie divide-y overflow-hidden rounded-2xl border">
            {time.membros.map((membro) => (
              <li
                key={membro.id}
                className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5"
              >
                {membro.avatar ? (
                  <Image
                    src={membro.avatar}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="bg-fundo-2 text-texto-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {membro.nome.slice(0, 1).toUpperCase()}
                  </span>
                )}

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-texto truncate font-medium">
                    {membro.nome}
                  </span>
                  <span className="text-texto-3 truncate text-xs">
                    {membro.email}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    apagar(
                      `/api/club/time/${membro.id}`,
                      `membro-${membro.id}`,
                      `Tirar ${membro.nome} do time?\n\nA conta continua existindo — a pessoa só perde o acesso que vinha do seu Club.`,
                    )
                  }
                  disabled={ocupado === `membro-${membro.id}`}
                  className="text-texto-3 hover:text-alerta shrink-0 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {ocupado === `membro-${membro.id}` ? "Tirando…" : "Tirar"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {time.convites.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-texto-2 text-sm font-semibold">
            Aguardando aceite ({time.convites.length})
          </h3>
          <ul className="border-borda divide-borda divide-y overflow-hidden rounded-2xl border border-dashed">
            {time.convites.map((convite) => (
              <li
                key={convite.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-sm sm:px-5"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-texto truncate font-medium">
                    {convite.nome}
                  </span>
                  <span className="text-texto-3 truncate text-xs">
                    {convite.email} · expira em{" "}
                    {data.format(new Date(convite.expiraEm))}
                  </span>
                </span>

                {!convite.emailEnviado && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/convite/${convite.token}`,
                      );
                      setOcupado(`copiado-${convite.id}`);
                      setTimeout(() => setOcupado(null), 2000);
                    }}
                    className="border-borda text-texto-2 hover:text-texto shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    {ocupado === `copiado-${convite.id}`
                      ? "Copiado"
                      : "Copiar link"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    apagar(
                      `/api/club/time/convites/${convite.id}`,
                      `convite-${convite.id}`,
                      `Cancelar o convite de ${convite.nome}?`,
                    )
                  }
                  disabled={ocupado === `convite-${convite.id}`}
                  className="text-texto-3 hover:text-alerta shrink-0 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {ocupado === `convite-${convite.id}`
                    ? "Cancelando…"
                    : "Cancelar"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

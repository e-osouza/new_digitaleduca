"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo, Nota } from "@/components/campo";
import type { MeuTime } from "@/types/api";

const dataCurta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/**
 * O painel inteiro do dono do Club.
 *
 * Cliente porque convidar, cancelar e remover acontecem aqui — as três
 * escritas precisam do mesmo estado de erro e do mesmo `router.refresh()`.
 *
 * Não há data por membro em lugar nenhum de propósito: o acesso de quem está
 * no time é o do dono, resolvido pela API a cada requisição. O prazo aparece
 * uma vez só, no cartão de situação, porque é um só.
 */
export function PainelClub({ time }: { time: MeuTime }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [linkNovo, setLinkNovo] = useState<{
    nome: string;
    url: string;
  } | null>(null);

  const semVaga = time.vagasRestantes <= 0;
  const podeConvidar = time.ativo && !semVaga;

  /*
   * Quem já entrou primeiro, quem ainda não aceitou depois. É a ordem em que a
   * pessoa pensa no próprio time — o que está de pé, e o que está pendurado.
   */
  const pessoas = [
    ...time.membros.map((dados) => ({ tipo: "membro" as const, dados })),
    ...time.convites.map((dados) => ({ tipo: "convite" as const, dados })),
  ];

  async function convidar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setLinkNovo(null);
    setEnviando(true);

    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);

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
      Quando o e-mail não sai, o convite existe igual e só falta chegar até a
      pessoa. Mostrar o link aqui é o que impede o recurso de morrer junto com
      o servidor de e-mail.
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

  function copiar(url: string, chave: string) {
    navigator.clipboard.writeText(url);
    setOcupado(chave);
    setTimeout(() => setOcupado(null), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {erro && <Aviso>{erro}</Aviso>}

      <section className="border-borda-suave bg-superficie flex flex-col gap-5 rounded-3xl border p-6 shadow-sm sm:p-8">
        <header className="flex flex-col gap-1">
          <h2 className="font-display text-base font-semibold">
            Convidar alguém
          </h2>
          <p className="text-texto-3 text-sm">
            A pessoa recebe um link, escolhe a própria senha e entra no time.
          </p>
        </header>

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
                  onClick={() => copiar(linkNovo.url, "link-novo")}
                  className="border-borda text-texto-2 hover:text-texto shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  {ocupado === "link-novo" ? "Copiado" : "Copiar"}
                </button>
              </span>
            </span>
          </Nota>
        )}

        {!time.ativo ? (
          <p className="border-borda bg-fundo-2 text-texto-2 rounded-lg border border-dashed p-4 text-sm">
            Convites ficam pausados enquanto a participação não estiver ativa.
            Você ainda pode organizar o time abaixo.
          </p>
        ) : semVaga ? (
          <p className="border-borda bg-fundo-2 text-texto-2 rounded-lg border border-dashed p-4 text-sm">
            Suas {time.limite} vagas estão ocupadas. Para chamar mais alguém,
            tire alguém do time ou cancele um convite em aberto.
          </p>
        ) : null}

        {podeConvidar && (
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
              className="bg-acento hover:bg-acento-hover flex min-h-12 w-fit items-center rounded-full px-7 text-sm font-bold text-white transition-colors disabled:opacity-60"
            >
              {enviando ? "Convidando…" : "Enviar convite"}
            </button>
          </form>
        )}
      </section>

      {/*
        Uma lista só, membros e convidados juntos.

        Eram duas seções irmãs, com títulos do mesmo tamanho, e a segunda só
        existia por causa de um detalhe de estado: quem foi convidado ainda não
        clicou no link. Para quem monta o time é a mesma lista — as pessoas que
        ele chamou —, e a diferença cabe numa marca ao lado do nome.
      */}
      <section className="flex flex-col gap-3">
        <h2 className="text-texto-3 text-[11px] font-semibold tracking-[0.14em] uppercase">
          Seu time
          {pessoas.length > 0 && (
            <span className="tabular-nums"> · {pessoas.length}</span>
          )}
        </h2>

        {pessoas.length === 0 ? (
          <p className="border-borda bg-superficie text-texto-2 rounded-3xl border border-dashed p-8 text-center text-sm">
            Ninguém no time ainda. Convide a primeira pessoa acima — ela passa a
            ver todo o conteúdo pela sua participação.
          </p>
        ) : (
          <ul className="border-borda-suave divide-borda-suave bg-superficie divide-y overflow-hidden rounded-3xl border shadow-sm">
            {pessoas.map((pessoa) =>
              pessoa.tipo === "membro" ? (
                <li
                  key={`membro-${pessoa.dados.id}`}
                  className="hover:bg-superficie-2/60 ease-suave flex items-center gap-3 px-5 py-4 transition-colors sm:px-6"
                >
                  {pessoa.dados.avatar ? (
                    <Image
                      src={pessoa.dados.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="ring-borda-suave h-10 w-10 shrink-0 rounded-full object-cover ring-1"
                      unoptimized
                    />
                  ) : (
                    <span className="bg-superficie-2 text-texto-2 ring-borda-suave flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1">
                      {pessoa.dados.nome.slice(0, 1).toUpperCase()}
                    </span>
                  )}

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-texto truncate text-sm font-medium">
                      {pessoa.dados.nome}
                    </span>
                    <span className="text-texto-3 truncate text-xs">
                      {pessoa.dados.email}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      apagar(
                        `/api/club/time/${pessoa.dados.id}`,
                        `membro-${pessoa.dados.id}`,
                        `Tirar ${pessoa.dados.nome} do time?\n\nA conta continua existindo — a pessoa só perde o acesso que vinha do seu Club.`,
                      )
                    }
                    disabled={ocupado === `membro-${pessoa.dados.id}`}
                    className="text-texto-3 hover:text-alerta shrink-0 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {ocupado === `membro-${pessoa.dados.id}`
                      ? "Tirando…"
                      : "Tirar"}
                  </button>
                </li>
              ) : (
                <li
                  key={`convite-${pessoa.dados.id}`}
                  className="hover:bg-superficie-2/60 ease-suave flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 transition-colors sm:px-6"
                >
                  {/*
                    Contorno tracejado, e não um avatar cheio: o lugar está
                    reservado, a pessoa ainda não chegou. É a mesma linguagem
                    das molduras tracejadas dos estados vazios da plataforma.
                  */}
                  <span className="border-borda text-texto-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed text-sm font-bold">
                    {pessoa.dados.nome.slice(0, 1).toUpperCase()}
                  </span>

                  {/*
                    `basis-48`: abaixo disso o nome não cabe, e a linha quebra
                    em vez de espremê-lo. Sem isso, o `flex-1` encolhia até
                    "B…" no celular, e o par de botões continuava lado a lado.
                  */}
                  <span className="flex min-w-0 flex-1 basis-48 flex-col">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-texto-2 truncate text-sm font-medium">
                        {pessoa.dados.nome}
                      </span>
                      <span className="border-borda text-texto-3 shrink-0 rounded-full border px-2 py-0.5 text-[11px] leading-tight font-semibold">
                        Aguardando
                      </span>
                    </span>
                    <span className="text-texto-3 truncate text-xs">
                      {pessoa.dados.email} · expira em{" "}
                      {dataCurta.format(new Date(pessoa.dados.expiraEm))}
                    </span>
                  </span>

                  <span className="ml-auto flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        copiar(
                          `${window.location.origin}/convite/${pessoa.dados.token}`,
                          `copia-${pessoa.dados.id}`,
                        )
                      }
                      className="border-borda text-texto-2 hover:text-texto rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                    >
                      {ocupado === `copia-${pessoa.dados.id}`
                        ? "Copiado"
                        : "Copiar link"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        apagar(
                          `/api/club/time/convites/${pessoa.dados.id}`,
                          `convite-${pessoa.dados.id}`,
                          `Cancelar o convite de ${pessoa.dados.nome}?`,
                        )
                      }
                      disabled={ocupado === `convite-${pessoa.dados.id}`}
                      className="text-texto-3 hover:text-alerta text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {ocupado === `convite-${pessoa.dados.id}`
                        ? "Cancelando…"
                        : "Cancelar"}
                    </button>
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

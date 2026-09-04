"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";
import { Modal } from "@/components/modal";

/** A palavra que precisa ser digitada à mão para o botão destravar. */
const PALAVRA = "EXCLUIR";

/**
 * Exclusão da própria conta.
 *
 * Três barreiras, e cada uma pega um erro diferente: o modal tira a ação do
 * fluxo da página (ninguém apaga a conta raspando o dedo na tela), a palavra
 * digitada exige uma decisão consciente — não dá para escrever EXCLUIR sem
 * saber o que se está fazendo — e a senha prova que quem está ali é o dono da
 * conta, e não alguém que sentou na máquina destravada.
 *
 * A senha continua sendo o que a API exige; a palavra é ritual, e vale contra
 * o clique impulsivo, que é o erro mais comum aqui. É irreversível: a API
 * apaga o cadastro e as assinaturas junto.
 */
export function ExcluirConta({ temSenha = true }: { temSenha?: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");

  /*
   * Sem diferenciar maiúsculas: o que se quer é a intenção de escrever a
   * palavra, e recusar "excluir" por causa do Caps Lock seria implicância —
   * quem digitou já entendeu o que vai acontecer.
   */
  const conferiu = confirmacao.trim().toUpperCase() === PALAVRA;

  function fechar() {
    if (enviando) return;
    setAberto(false);
    setErro("");
    setConfirmacao("");
  }

  async function excluir(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!conferiu) return;

    setErro("");
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);

    try {
      const resposta = await fetch("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: String(dados.get("senha") ?? "") }),
      });

      const corpo = (await resposta.json().catch(() => ({}))) as {
        erro?: string;
      };

      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível excluir a conta.");
        setEnviando(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
      setEnviando(false);
    }
  }

  return (
    <section className="border-alerta/40 flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-alerta font-display text-base font-semibold">
          Excluir conta
        </h2>
        <p className="text-texto-3 text-sm leading-relaxed">
          Apaga seu cadastro e suas assinaturas. O histórico de progresso e a
          sua lista são perdidos. Não há como desfazer.
        </p>
      </div>

      {!temSenha ? (
        /*
          Conta social (Google/Apple) não tem senha, e a API exige a senha para
          excluir. Em vez de deixar a pessoa abrir o modal e bater num erro,
          mostramos a instrução aqui, visível, com o caminho para definir a
          senha (o código vai para o e-mail que ela controla).
        */
        <Aviso>
          Sua conta entra pelo <strong>Google ou Apple</strong> e ainda não tem
          senha. Por segurança, para excluir a conta você precisa primeiro{" "}
          <Link
            href="/recuperar-senha"
            className="text-alerta font-semibold underline underline-offset-2"
          >
            definir uma senha
          </Link>{" "}
          e depois voltar aqui.
        </Aviso>
      ) : (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="border-alerta/50 text-alerta hover:bg-alerta/10 flex min-h-11 w-fit items-center rounded-full border px-5 text-sm font-semibold transition-colors"
        >
          Quero excluir minha conta
        </button>
      )}

      {temSenha && (
      <Modal
        aberto={aberto}
        aoFechar={fechar}
        titulo="Tem certeza que quer excluir sua conta?"
        largura="28rem"
        /* Enquanto a chamada corre, Esc e clique fora não fecham: o pedido já
           está a caminho e sumir com a tela esconderia o resultado. */
        impedirFechar={enviando}
      >
        <form onSubmit={excluir} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-texto-2 text-sm leading-relaxed">
              Isto apaga seu cadastro, suas assinaturas, o histórico de
              progresso e as suas listas.{" "}
              <strong className="text-texto font-semibold">
                Não há como desfazer
              </strong>
              , e nós não conseguimos recuperar nada depois.
            </p>
            <p className="text-texto-3 text-sm leading-relaxed">
              Se o que você quer é só parar de pagar, cancele a assinatura em
              Planos — a conta e o seu progresso continuam aqui.
            </p>
          </div>

          {erro && <Aviso>{erro}</Aviso>}

          <Campo
            id="confirmacao-exclusao"
            name="confirmacao"
            rotulo={`Digite ${PALAVRA} para confirmar`}
            value={confirmacao}
            onChange={(evento) => setConfirmacao(evento.target.value)}
            /* Nada de ajuda do teclado: a palavra tem de vir da pessoa. */
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus
            required
            placeholder={PALAVRA}
          />

          <Campo
            id="senha-exclusao"
            name="senha"
            rotulo="Confirme sua senha"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            dica="Precisamos confirmar que é você."
          />

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={fechar}
              disabled={enviando}
              className="border-borda bg-superficie hover:bg-superficie-2 flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              /*
                Trancado até a palavra bater. `disabled` e não só a checagem no
                envio: o botão apagado é o que mostra que falta um passo, em vez
                de deixar a pessoa clicar e receber um erro.
              */
              disabled={enviando || !conferiu}
              className="bg-alerta flex min-h-11 items-center rounded-full px-5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
            >
              {enviando ? "Excluindo…" : "Excluir definitivamente"}
            </button>
          </div>
        </form>
      </Modal>
      )}
    </section>
  );
}

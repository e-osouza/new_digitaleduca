"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";
import { CampoCelular } from "@/components/campo-celular";
import { CampoSenha } from "@/components/campo-senha";

export function FormularioCadastro() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);

    try {
      const resposta = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: dados.get("nome"),
          email: dados.get("email"),
          senha: dados.get("senha"),
          celular: dados.get("celular"),
          aceitaNotificacoes: dados.get("aceitaNotificacoes") === "on",
        }),
      });

      const corpo = (await resposta.json().catch(() => ({}))) as {
        erro?: string;
        autenticado?: boolean;
      };

      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível criar a conta.");
        setEnviando(false);
        return;
      }

      /*
       * Conta criada e sessão aberta: vai direto para a confirmação do e-mail.
       * O código acabou de ser enviado, e este é o único momento em que a
       * pessoa tem o e-mail aberto por causa do cadastro — mandá-la para
       * `/inicio` deixava a confirmação por conta de uma faixa discreta no topo
       * que muita gente nunca lê. De lá dá para pular para o catálogo.
       *
       * Sem sessão, a conta existe mas o login automático falhou; o `criada=1`
       * é o que faz a tela de login explicar isso em vez de aparecer em branco.
       */
      router.replace(corpo.autenticado ? "/verificar-email" : "/?criada=1");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente de novo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      {erro && <Aviso>{erro}</Aviso>}

      <Campo
        id="nome"
        name="nome"
        rotulo="Nome completo"
        autoComplete="name"
        required
        placeholder="Maria Silva"
      />

      <Campo
        id="email"
        name="email"
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        required
        placeholder="voce@exemplo.com"
      />

      <CampoCelular required />

      <CampoSenha
        id="senha"
        name="senha"
        rotulo="Senha"
        autoComplete="new-password"
        required
        minLength={6}
        placeholder="••••••••"
        dica="Ao menos 6 caracteres."
      />

      <label className="text-texto-2 flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          name="aceitaNotificacoes"
          defaultChecked
          className="accent-acento mt-0.5 h-4 w-4"
        />
        <span>Quero receber avisos sobre novos conteúdos e trilhas.</span>
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="bg-acento text-white hover:bg-acento-hover mt-2 rounded-full px-6 py-3 text-sm font-bold transition-colors disabled:opacity-60"
      >
        {enviando ? "Criando conta…" : "Criar conta"}
      </button>

      <p className="text-texto-3 text-center text-sm">
        Já tem conta?{" "}
        <Link href="/" className="text-acento hover:text-acento-claro font-semibold">
          Entrar
        </Link>
      </p>
    </form>
  );
}

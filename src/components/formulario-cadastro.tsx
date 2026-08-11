"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";

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

      // Se o login automático falhar, a conta existe — mandamos para /entrar.
      router.replace(corpo.autenticado ? "/inicio" : "/entrar");
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

      <Campo
        id="celular"
        name="celular"
        rotulo="Celular"
        type="tel"
        autoComplete="tel"
        required
        placeholder="(11) 90000-0000"
      />

      <Campo
        id="senha"
        name="senha"
        rotulo="Senha"
        type="password"
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
        className="bg-acento text-fundo hover:bg-acento-claro mt-2 rounded-full px-6 py-3 text-sm font-bold transition-colors disabled:opacity-60"
      >
        {enviando ? "Criando conta…" : "Criar conta"}
      </button>

      <p className="text-texto-3 text-center text-sm">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-acento hover:text-acento-claro font-semibold">
          Entrar
        </Link>
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";
import { CampoSenha } from "@/components/campo-senha";

export function FormularioLogin({ proximo = "/inicio" }: { proximo?: string }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: dados.get("email"),
          senha: dados.get("senha"),
        }),
      });

      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => ({}))) as {
          erro?: string;
        };
        setErro(corpo.erro ?? "Não foi possível entrar.");
        setEnviando(false);
        return;
      }

      router.replace(proximo);
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
        id="email"
        name="email"
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        required
        autoFocus
        placeholder="voce@exemplo.com"
        icone={
          <svg
            viewBox="0 0 20 20"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2.2" y="4.5" width="15.6" height="11" rx="2" />
            <path d="m2.8 6 6.2 4.6a1.7 1.7 0 0 0 2 0L17.2 6" />
          </svg>
        }
      />

      <div className="flex flex-col gap-1.5">
        <CampoSenha
          id="senha"
          name="senha"
          rotulo="Senha"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
        {/* Alinhado à direita, sob o próprio campo a que se refere. */}
        <Link
          href="/recuperar-senha"
          className="text-texto-3 hover:text-acento self-end text-sm transition-colors"
        >
          Esqueci minha senha
        </Link>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="bg-acento text-white hover:bg-acento-hover mt-2 flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-texto-3 text-center text-sm">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="text-acento hover:text-acento-claro font-semibold"
        >
          Criar agora
        </Link>
      </p>
    </form>
  );
}

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
        const corpo = (await resposta.json().catch(() => ({}))) as { erro?: string };
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
        <Link
          href="/recuperar-senha"
          className="text-texto-3 hover:text-acento w-fit text-sm transition-colors"
        >
          Esqueci minha senha
        </Link>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="bg-acento text-white hover:bg-acento-hover mt-2 rounded-full px-6 py-3 text-sm font-bold transition-colors disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-texto-3 text-center text-sm">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-acento hover:text-acento-claro font-semibold">
          Criar agora
        </Link>
      </p>
    </form>
  );
}

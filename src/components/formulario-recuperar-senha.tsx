"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";

type Passo = "email" | "codigo" | "senha" | "pronto";

export function FormularioRecuperarSenha() {
  const router = useRouter();
  const [passo, setPasso] = useState<Passo>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function chamar(rota: string, corpo: Record<string, unknown>) {
    const resposta = await fetch(rota, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    const dados = (await resposta.json().catch(() => ({}))) as {
      erro?: string;
      token?: string;
    };
    if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível continuar.");
    return dados;
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setAviso("");
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);

    try {
      if (passo === "email") {
        const valor = String(dados.get("email") ?? "").trim().toLowerCase();
        await chamar("/api/senha/solicitar", { email: valor });
        setEmail(valor);
        setPasso("codigo");
      } else if (passo === "codigo") {
        const { token: recebido } = await chamar("/api/senha/verificar", {
          email,
          codigo: String(dados.get("codigo") ?? "").trim(),
        });
        setToken(recebido ?? "");
        setPasso("senha");
      } else if (passo === "senha") {
        await chamar("/api/senha/confirmar", {
          token,
          novaSenha: String(dados.get("novaSenha") ?? ""),
        });
        setPasso("pronto");
      }
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Erro inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  async function reenviar() {
    setErro("");
    setEnviando(true);
    try {
      await chamar("/api/senha/solicitar", { email });
      setAviso("Enviamos um novo código.");
    } catch {
      setErro("Não foi possível reenviar agora.");
    } finally {
      setEnviando(false);
    }
  }

  if (passo === "pronto") {
    return (
      <div className="flex flex-col gap-5">
        <p className="border-sucesso/40 bg-sucesso/10 text-sucesso rounded-lg border px-3.5 py-2.5 text-sm">
          Senha redefinida. Já pode entrar com ela.
        </p>
        <button
          type="button"
          onClick={() => router.replace("/entrar")}
          className="bg-acento text-fundo hover:bg-acento-hover min-h-12 rounded-full px-6 text-sm font-bold transition-colors"
        >
          Ir para o login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      {erro && <Aviso>{erro}</Aviso>}
      {aviso && (
        <p
          role="status"
          className="border-sucesso/40 bg-sucesso/10 text-sucesso rounded-lg border px-3.5 py-2.5 text-sm"
        >
          {aviso}
        </p>
      )}

      {passo === "email" && (
        <Campo
          id="email"
          name="email"
          rotulo="E-mail da conta"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@exemplo.com"
          dica="Enviaremos um código de 4 dígitos."
        />
      )}

      {passo === "codigo" && (
        <>
          <p className="text-texto-3 text-sm">
            Enviamos um código para <strong className="text-texto-2">{email}</strong>.
          </p>
          <Campo
            id="codigo"
            name="codigo"
            rotulo="Código de 4 dígitos"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={4}
            pattern="\d{4}"
            placeholder="0000"
          />
          <button
            type="button"
            onClick={reenviar}
            disabled={enviando}
            className="text-acento hover:text-acento-hover w-fit text-sm font-semibold transition-colors disabled:opacity-60"
          >
            Reenviar código
          </button>
        </>
      )}

      {passo === "senha" && (
        <Campo
          id="novaSenha"
          name="novaSenha"
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••••"
          dica="Ao menos 6 caracteres."
        />
      )}

      <button
        type="submit"
        disabled={enviando}
        className="bg-acento text-fundo hover:bg-acento-hover mt-2 min-h-12 rounded-full px-6 text-sm font-bold transition-colors disabled:opacity-60"
      >
        {enviando
          ? "Enviando…"
          : passo === "email"
            ? "Enviar código"
            : passo === "codigo"
              ? "Validar código"
              : "Salvar nova senha"}
      </button>

      <p className="text-texto-3 text-center text-sm">
        Lembrou a senha?{" "}
        <Link href="/entrar" className="text-acento hover:text-acento-hover font-semibold">
          Entrar
        </Link>
      </p>
    </form>
  );
}

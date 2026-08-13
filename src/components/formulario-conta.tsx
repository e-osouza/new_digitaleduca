"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";
import type { Usuario } from "@/types/api";

const PERFIL = [
  { id: "cargo", rotulo: "Cargo", exemplo: "Diretor comercial" },
  { id: "funcao", rotulo: "Função", exemplo: "Gestão de time" },
  { id: "areaAtuacao", rotulo: "Área de atuação", exemplo: "Varejo" },
  {
    id: "tempoExperiencia",
    rotulo: "Tempo de experiência",
    exemplo: "5 a 10 anos",
  },
  {
    id: "objetivoPlataforma",
    rotulo: "Objetivo na plataforma",
    exemplo: "Escalar vendas",
  },
  {
    id: "formatoAprendizado",
    rotulo: "Formato preferido",
    exemplo: "Aulas curtas",
  },
] as const;

export function FormularioConta({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSalvo(false);
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    const corpo: Record<string, unknown> = {};

    for (const [chave, valor] of dados.entries()) {
      if (typeof valor === "string") corpo[chave] = valor;
    }

    try {
      const resposta = await fetch("/api/conta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });

      const retorno = (await resposta.json().catch(() => ({}))) as {
        erro?: string;
      };

      if (!resposta.ok) {
        setErro(retorno.erro ?? "Não foi possível salvar.");
        setEnviando(false);
        return;
      }

      setSalvo(true);
      setEnviando(false);
      router.refresh();
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente de novo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-8">
      {erro && <Aviso>{erro}</Aviso>}
      {salvo && (
        <p
          role="status"
          className="border-sucesso/40 bg-sucesso/10 text-sucesso animate-surgir rounded-lg border px-3.5 py-2.5 text-sm"
        >
          Alterações salvas.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-base font-semibold">Dados pessoais</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="nome"
            name="nome"
            rotulo="Nome completo"
            defaultValue={usuario.nome ?? ""}
            autoComplete="name"
          />
          <Campo
            id="email"
            name="email"
            rotulo="E-mail"
            type="email"
            defaultValue={usuario.email ?? ""}
            autoComplete="email"
          />
          <Campo
            id="celular"
            name="celular"
            rotulo="Celular"
            type="tel"
            defaultValue={usuario.celular ?? ""}
            autoComplete="tel"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-base font-semibold">Seu perfil</h2>
          <p className="text-texto-3 text-sm">
            Usado para recomendar conteúdos mais próximos do seu momento.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PERFIL.map((campo) => (
            <Campo
              key={campo.id}
              id={campo.id}
              name={campo.id}
              rotulo={campo.rotulo}
              placeholder={campo.exemplo}
              defaultValue={(usuario[campo.id] as string | null) ?? ""}
            />
          ))}
        </div>
      </section>

      <div className="border-borda-suave flex items-center gap-4 border-t pt-6">
        <button
          type="submit"
          disabled={enviando}
          className="bg-acento text-white hover:bg-acento-hover flex min-h-12 items-center rounded-full px-7 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

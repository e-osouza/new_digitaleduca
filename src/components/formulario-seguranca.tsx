"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";

/**
 * Senha e avisos. Saiu do formulário de perfil quando as configurações viraram
 * abas: são decisões sobre a conta, não sobre quem o usuário é.
 *
 * Vai para o mesmo `PUT /api/conta`, que aceita envio parcial — senha em branco
 * simplesmente não entra no corpo.
 */
export function FormularioSeguranca({
  aceitaNotificacoes,
}: {
  aceitaNotificacoes: boolean;
}) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSalvo(false);
    setEnviando(true);

    // Guardado antes do await: `currentTarget` já não aponta para o formulário
    // depois que o despacho do evento termina.
    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);
    const senha = String(dados.get("senha") ?? "");

    const corpo: Record<string, unknown> = {
      aceitaNotificacoes: dados.get("aceitaNotificacoes") === "on",
    };
    if (senha.length > 0) corpo.senha = senha;

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

      /*
       * Só o campo de senha é limpo. Um `reset()` no formulário inteiro devolveria
       * a caixa de notificações ao valor que veio do servidor nesta renderização,
       * desfazendo na tela a escolha que acabou de ser gravada.
       */
      const campoSenha = formulario.elements.namedItem("senha");
      if (campoSenha instanceof HTMLInputElement) campoSenha.value = "";

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
        <h2 className="font-display text-base font-semibold">Segurança</h2>
        <Campo
          id="senha"
          name="senha"
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          dica="Deixe em branco para manter a senha atual."
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-base font-semibold">Notificações</h2>
        <label className="text-texto-2 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="aceitaNotificacoes"
            defaultChecked={aceitaNotificacoes}
            className="accent-acento mt-0.5 h-4 w-4"
          />
          <span>Receber avisos sobre novos conteúdos e trilhas.</span>
        </label>
      </section>

      <div className="border-borda-suave flex items-center gap-4 border-t pt-6">
        <button
          type="submit"
          disabled={enviando}
          className="bg-acento text-white hover:bg-acento-hover flex min-h-12 items-center rounded-full px-7 text-sm font-bold disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

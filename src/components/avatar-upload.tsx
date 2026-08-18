"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Avatar do usuário que também é o botão de upload: clicar abre o seletor de
 * arquivo, a API comprime a imagem e apaga a anterior. Mostra a foto quando
 * existe, ou a inicial do nome. Um preview local aparece na hora, antes de o
 * servidor responder.
 */
export function AvatarUpload({
  avatar,
  nome,
}: {
  avatar: string | null;
  nome: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const inicial = nome.trim().charAt(0).toUpperCase() || "?";

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem.");
      return;
    }

    setErro("");
    const urlLocal = URL.createObjectURL(file);
    setPreview(urlLocal);
    setEnviando(true);

    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const r = await fetch("/api/perfil/avatar", { method: "POST", body: fd });
      const corpo = (await r.json().catch(() => ({}))) as { erro?: string };
      if (!r.ok) {
        setErro(corpo.erro ?? "Não foi possível enviar a foto.");
        setPreview(null);
      } else {
        // O servidor já tem a nova foto; recarrega para pegar a URL definitiva.
        router.refresh();
      }
    } catch {
      setErro("Falha de conexão.");
      setPreview(null);
    } finally {
      setEnviando(false);
      URL.revokeObjectURL(urlLocal);
    }
  }

  const temImagem = Boolean(preview || avatar);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
        aria-label={temImagem ? "Trocar foto de perfil" : "Enviar foto de perfil"}
        className="group border-borda-suave relative h-20 w-20 shrink-0 overflow-hidden rounded-full border"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : avatar ? (
          <Image src={avatar} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <span className="bg-acento font-display flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
            {inicial}
          </span>
        )}

        {/* Overlay de câmera no hover (ou sempre, quando não há foto) */}
        <span
          className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity ${
            temImagem ? "opacity-0 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-1.6a1 1 0 0 1 .8-.4h5a1 1 0 0 1 .8.4L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
            <circle cx="12" cy="12.5" r="3" />
          </svg>
        </span>

        {enviando && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[11px] font-medium text-white">
            Enviando…
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
        className="text-texto-3 hover:text-acento text-xs font-medium transition-colors disabled:opacity-60"
      >
        {temImagem ? "Trocar foto" : "Enviar foto"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={aoEscolher}
      />

      {erro && (
        <span role="alert" className="text-alerta max-w-[8rem] text-center text-[11px]">
          {erro}
        </span>
      )}
    </div>
  );
}

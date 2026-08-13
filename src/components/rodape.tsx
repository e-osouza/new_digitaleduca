import { SITE_INSTITUCIONAL } from "@/lib/nav";

/**
 * Rodapé das telas de acesso.
 *
 * Enxuto de propósito: o texto de contato, os botões das lojas e a âncora
 * `#contato` pertenciam à landing, que agora vive em `digitaleduca.com.vc`.
 * Quem chega aqui quer entrar na plataforma, não ler material institucional —
 * fica só o crédito e um caminho de volta para o site.
 */
export function Rodape() {
  return (
    <footer className="border-borda-suave mt-auto border-t">
      <div className="text-texto-3 mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <p>
          © {new Date().getFullYear()} Digital Educa. Todos os direitos
          reservados.
        </p>
        <a
          href={SITE_INSTITUCIONAL}
          className="hover:text-acento transition-colors"
        >
          Conheça o Digital Educa
        </a>
      </div>
    </footer>
  );
}

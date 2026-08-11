import Link from "next/link";
import { Marca } from "@/components/marca";

export function Rodape() {
  return (
    <footer id="contato" className="border-borda-suave mt-auto border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-14 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4">
            <Marca altura={28} />
            <p className="text-texto-2 max-w-xs text-sm leading-relaxed">
              Converse com a equipe do Digital Educa. Estamos prontos para ajudar
              você a destravar o crescimento do seu negócio.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-texto-3 text-xs font-semibold tracking-wider uppercase">
              Disponível para download
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://play.google.com/store/apps/details?id=vc.agenciadigital.digitaleduca"
                target="_blank"
                rel="noopener noreferrer"
                className="border-borda-suave hover:border-acento/60 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Google Play
              </a>
              <a
                href="https://apps.apple.com/br/app/digital-educa/id6761863445"
                target="_blank"
                rel="noopener noreferrer"
                className="border-borda-suave hover:border-acento/60 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
              >
                App Store
              </a>
            </div>
          </div>
        </div>

        <div className="border-borda-suave text-texto-3 flex flex-col gap-2 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Digital Educa. Todos os direitos reservados.</p>
          <Link href="/entrar" className="hover:text-acento transition-colors">
            Acessar a plataforma
          </Link>
        </div>
      </div>
    </footer>
  );
}

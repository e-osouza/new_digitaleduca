import "server-only";
import { api, apiOpcional } from "@/lib/api";
import type {
  Assinatura,
  AvaliacaoMedia,
  AvaliacaoUsuario,
  Categoria,
  CategoriaComConteudos,
  Conteudo,
  Interesse,
  Negocio,
  ConteudoEmAndamento,
  ConteudoResumo,
  ConteudoSelecionado,
  PerfilInstrutor,
  Tag,
  TagDetalhe,
  Envelope,
  Instrutor,
  ListaPaginada,
  MeResponse,
  Plano,
  ProgressoVideo,
  TipoConteudo,
  TipoDisponivel,
  Trilha,
  TrilhaBruta,
  Usuario,
  Video,
  VimeoLink,
} from "@/types/api";

function query(params: Record<string, string | number | boolean | undefined>) {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== "") busca.set(chave, String(valor));
  }
  const s = busca.toString();
  return s ? `?${s}` : "";
}

/* ---------------- catálogo público ---------------- */

export function listarConteudos(opcoes: {
  tipo?: TipoConteudo;
  destaque?: boolean;
  instrutorId?: number;
  page?: number;
  limit?: number;
}) {
  return api<ListaPaginada<Conteudo>>(
    `/conteudos${query({ page: 1, limit: 12, ...opcoes })}`,
    { revalidar: 300 },
  );
}

export function listarTop10(opcoes: { tipo?: TipoConteudo; categoriaId?: number } = {}) {
  return api<Envelope<Conteudo>>(`/conteudos/top10${query(opcoes)}`, {
    revalidar: 600,
  });
}

export function listarTipos() {
  return api<Envelope<TipoDisponivel>>("/conteudos/tipos", { revalidar: 3600 });
}

export function listarCategorias(tipo?: TipoConteudo) {
  return api<Envelope<{ id: number; nome: string }>>(
    `/conteudos/categorias${query({ tipo })}`,
    { revalidar: 3600 },
  );
}

/** Árvore categoria → subcategorias → conteúdos, só com o que é gratuito. */
export function arvoreFreemium() {
  return api<CategoriaComConteudos[]>("/categorias/freemium", { revalidar: 600 });
}

/** Mesma árvore, com o acervo que exige assinatura. */
export function arvorePremium() {
  return api<CategoriaComConteudos[]>("/categorias/premium", { revalidar: 600 });
}

export function listarInstrutores(limit = 12) {
  return api<Instrutor[]>(`/instrutor/lista${query({ limit })}`, {
    revalidar: 3600,
  });
}

export function listarPlanos() {
  return api<Plano[]>("/planos", { revalidar: 3600 });
}

/* ---------------- catálogo autenticado ---------------- */

export function obterConteudo(id: number) {
  return api<Conteudo>(`/conteudos/${id}`, {
    autenticado: true,
    revalidar: 120,
  });
}

export function recomendados(id: number, limit = 8) {
  return apiOpcional<Conteudo[] | Envelope<Conteudo>>(
    `/conteudos/${id}/recomendados${query({ limit })}`,
    { autenticado: true, revalidar: 300 },
  );
}

export function buscarConteudos(opcoes: {
  q: string;
  tipo?: TipoConteudo;
  categoriaId?: number;
  subcategoriaId?: number;
  tags?: string;
  page?: number;
  limit?: number;
}) {
  return api<ListaPaginada<Conteudo> | { items: Conteudo[]; page: number; total: number }>(
    `/conteudos/search${query({ page: 1, limit: 20, ...opcoes })}`,
    { autenticado: true, revalidar: false },
  );
}

/* ---------------- usuário e progresso ---------------- */

export function obterMe() {
  return apiOpcional<MeResponse>("/usuario/me", {
    autenticado: true,
    revalidar: false,
  });
}

/**
 * Devolve já normalizado: a API responde `{ data: [...] }`, apesar do exemplo
 * do Swagger mostrar um array puro — o que quebrava a página com
 * "progresso.flatMap is not a function".
 */
export async function emAndamento(limit = 8): Promise<ConteudoEmAndamento[]> {
  const resposta = await apiOpcional<
    Envelope<ConteudoEmAndamento> | ConteudoEmAndamento[]
  >(`/progresso-video/em-andamento${query({ limit })}`, {
    autenticado: true,
    revalidar: false,
  });

  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  return Array.isArray(resposta.data) ? resposta.data : [];
}

/**
 * Converte o item de progresso na forma que o card de conteúdo espera. Os
 * campos vêm todos do próprio endpoint, sem precisar cruzar com o catálogo.
 */
export function paraCard(item: ConteudoEmAndamento): ConteudoResumo {
  return {
    id: item.conteudoId,
    categoriaId: 0,
    titulo: item.titulo,
    descricao: null,
    tipo: item.tipo,
    level: null,
    gratuitoTipo: item.gratuitoTipo,
    gratuitoAte: item.gratuitoAte,
    thumbnailDesktop: item.thumbnailDesktop,
    thumbnailMobile: item.thumbnailMobile,
    thumbnailDestaque: null,
  };
}

export function assistidosRecentemente() {
  return apiOpcional<ProgressoVideo[]>("/progresso-video/recentes", {
    autenticado: true,
    revalidar: false,
  });
}

export function progressoDoVideo(videoId: number) {
  return apiOpcional<ProgressoVideo>(`/progresso-video/${videoId}`, {
    autenticado: true,
    revalidar: false,
  });
}

/* ---------------- perfil complementar ---------------- */

/** `GET /negocio/me` — devolve null quando o usuário ainda não cadastrou. */
export function obterNegocio() {
  return apiOpcional<Negocio>("/negocio/me", {
    autenticado: true,
    revalidar: false,
  });
}

export function obterInteresse() {
  return apiOpcional<Interesse>("/interesse/me", {
    autenticado: true,
    revalidar: false,
  });
}

/* ---------------- minha lista ---------------- */

/**
 * A API filtra a lista pelo acesso do usuário: sem assinatura, só devolve o
 * que é gratuito. Aceita array puro ou envelope, por segurança.
 */
export async function listarSelecionados(): Promise<ConteudoSelecionado[]> {
  const resposta = await apiOpcional<
    ConteudoSelecionado[] | Envelope<ConteudoSelecionado>
  >("/conteudos-selecionados", { autenticado: true, revalidar: false });

  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  return Array.isArray(resposta.data) ? resposta.data : [];
}

/* ---------------- avaliação ---------------- */

export function mediaDoVideo(videoId: number) {
  return apiOpcional<AvaliacaoMedia>(`/avaliacao-video/${videoId}`, {
    autenticado: true,
    revalidar: false,
  });
}

export function minhaAvaliacao(videoId: number) {
  return apiOpcional<AvaliacaoUsuario>(`/avaliacao-video/user/${videoId}`, {
    autenticado: true,
    revalidar: false,
  });
}

/* ---------------- descoberta ---------------- */

export function obterTag(id: number) {
  return apiOpcional<TagDetalhe>(`/tags/${id}`, { revalidar: 600 });
}

export function listarTags() {
  return api<Tag[]>("/tags", { revalidar: 3600 });
}

export function perfilInstrutor(
  id: number,
  opcoes: { tipo?: TipoConteudo; page?: number; limit?: number } = {},
) {
  return apiOpcional<PerfilInstrutor>(
    `/instrutor/${id}/perfil${query({ page: 1, limit: 24, ...opcoes })}`,
    { revalidar: 300 },
  );
}

export function obterCategoria(id: number) {
  return apiOpcional<Categoria>(`/categorias/${id}`, { revalidar: 3600 });
}

/**
 * `GET /conteudos` ignora `categoriaId` (conferido no controller e ao vivo),
 * então montamos a categoria a partir das árvores freemium + premium, que já
 * vêm agrupadas por subcategoria. Conteúdos repetidos entre as duas são
 * removidos pelo id.
 */
export async function conteudosDaCategoria(categoriaId: number): Promise<{
  nome: string | null;
  subcategorias: { id: number; nome: string; conteudos: ConteudoResumo[] }[];
}> {
  const [gratuitos, premium] = await Promise.all([
    arvoreFreemium().catch(() => [] as CategoriaComConteudos[]),
    arvorePremium().catch(() => [] as CategoriaComConteudos[]),
  ]);

  const encontradas = [...gratuitos, ...premium].filter(
    (c) => c.id === categoriaId,
  );
  if (encontradas.length === 0) return { nome: null, subcategorias: [] };

  const porSubcategoria = new Map<
    number,
    { id: number; nome: string; conteudos: Map<number, ConteudoResumo> }
  >();

  for (const categoria of encontradas) {
    for (const sub of categoria.subcategorias) {
      const alvo = porSubcategoria.get(sub.id) ?? {
        id: sub.id,
        nome: sub.nome,
        conteudos: new Map<number, ConteudoResumo>(),
      };
      for (const conteudo of sub.conteudos) alvo.conteudos.set(conteudo.id, conteudo);
      porSubcategoria.set(sub.id, alvo);
    }
  }

  return {
    nome: encontradas[0].categoria,
    subcategorias: [...porSubcategoria.values()]
      .map((s) => ({ id: s.id, nome: s.nome, conteudos: [...s.conteudos.values()] }))
      .filter((s) => s.conteudos.length > 0),
  };
}

/* ---------------- trilhas ---------------- */

/**
 * `GET /trilhas` não tem schema na spec. Devolvemos o bruto e normalizamos em
 * `normalizarTrilhas`, tolerando array puro ou envelope `{data}`.
 */
export function listarTrilhas() {
  return apiOpcional<TrilhaBruta[] | Envelope<TrilhaBruta>>("/trilhas", {
    autenticado: true,
    revalidar: false,
  });
}

export function obterTrilha(id: number) {
  return apiOpcional<TrilhaBruta>(`/trilhas/${id}`, {
    autenticado: true,
    revalidar: false,
  });
}

export function videosDaTrilha(id: number) {
  return apiOpcional<unknown>(`/trilhas/${id}/videos`, {
    autenticado: true,
    revalidar: false,
  });
}

/** Reduz as variações possíveis de nome de campo a uma forma única. */
export function normalizarTrilhas(
  resposta: TrilhaBruta[] | Envelope<TrilhaBruta> | null,
): Trilha[] {
  if (!resposta) return [];

  const lista = Array.isArray(resposta) ? resposta : (resposta.data ?? []);
  if (!Array.isArray(lista)) return [];

  return lista.flatMap((bruta) => {
    const id = Number(bruta?.id);
    if (!Number.isInteger(id)) return [];

    const itens = bruta.itens ?? bruta.items;

    return [
      {
        id,
        titulo:
          bruta.titulo ?? bruta.nome ?? bruta.title ?? bruta.name ?? "Trilha",
        descricao: bruta.descricao ?? bruta.description ?? null,
        progresso: numeroOuNulo(bruta.progresso ?? bruta.progress),
        totalItens:
          numeroOuNulo(bruta.totalItens ?? bruta.totalItems) ??
          (Array.isArray(itens) ? itens.length : null),
        concluidos: numeroOuNulo(bruta.concluidos ?? bruta.completed),
      },
    ];
  });
}

function numeroOuNulo(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/* ---------------- vídeo ---------------- */

/**
 * Busca o registro do vídeo no banco. É daqui que sai a `url` com o ID do
 * Vimeo — a listagem de conteúdos devolve os vídeos sem esse campo.
 */
export function obterVideo(id: number) {
  return apiOpcional<Video>(`/video/${id}`, {
    autenticado: true,
    revalidar: 300,
  });
}

export function linkDoVideo(vimeoId: string) {
  return api<VimeoLink>(`/vimeo-client/video/${vimeoId}/link`, {
    autenticado: true,
    revalidar: false,
  });
}

/**
 * Normaliza `GET /usuario/me`.
 *
 * A API só inclui `assinatura` quando ela está ATIVA e dentro do período, de
 * modo que a presença do bloco já basta como sinal de acesso — não é preciso
 * reavaliar datas aqui.
 *
 * Ressalva importante: a resposta **não traz a `role`**, então o front não
 * distingue CORTESIA de USER quando não existe assinatura registrada. Um
 * usuário com role CORTESIA e sem cortesia datada tem acesso liberado pela API
 * (ver `acesso.service.ts` no backend) e ainda assim apareceria aqui como sem
 * assinatura. Por isso nenhuma tela usa este retorno para *bloquear* conteúdo:
 * ele serve só para rotular a conta. Quem autoriza é sempre a API.
 */
export function normalizarMe(resposta: MeResponse | null): {
  usuario: Usuario | null;
  assinatura: Assinatura | null;
  temAssinaturaAtiva: boolean;
  ehCortesia: boolean;
} {
  const vazio = {
    usuario: null,
    assinatura: null,
    temAssinaturaAtiva: false,
    ehCortesia: false,
  };

  if (!resposta) return vazio;

  const usuario =
    typeof resposta.email === "string"
      ? (resposta as unknown as Usuario)
      : null;

  const assinatura = resposta.assinatura ?? null;
  const status = assinatura?.status?.toUpperCase();
  const temAssinaturaAtiva = Boolean(
    assinatura && (!status || ["ATIVA", "ACTIVE", "AUTHORIZED"].includes(status)),
  );

  // O backend grava tanto CORTESIA quanto o legado com erro de digitação.
  const metodo = assinatura?.metodoPagamento?.toUpperCase() ?? "";
  const ehCortesia = metodo === "CORTESIA" || metodo === "CORTERSIA";

  return { usuario, assinatura, temAssinaturaAtiva, ehCortesia };
}

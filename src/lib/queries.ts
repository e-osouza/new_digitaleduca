import "server-only";
import { cache } from "react";
import { api, apiOpcional, ApiError } from "@/lib/api";
import type {
  Assinatura,
  AvaliacaoMedia,
  AvaliacaoUsuario,
  Categoria,
  CategoriaComConteudos,
  Conteudo,
  ConteudoCatalogo,
  ConteudoEmAndamento,
  ConteudoResumo,
  ConvitePublico,
  Envelope,
  EstatisticasDetalhadas,
  EstatisticasDoTime,
  EstatisticasUsuario,
  Instrutor,
  Interesse,
  Lista,
  ListaDetalhe,
  ListaPaginada,
  MeResponse,
  MeuTime,
  Negocio,
  PerfilInstrutor,
  Plano,
  ProgressoVideo,
  Propaganda,
  Salvo,
  Subcategoria,
  Tag,
  TagDetalhe,
  TipoConteudo,
  TipoDisponivel,
  Trilha,
  TrilhaDetalhe,
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
  /**
   * Filtram no BANCO desde 24/08/2026. Antes a rota os ignorava, e a listagem
   * precisava pedir o acervo inteiro para recortar em memória.
   */
  categoriaId?: number;
  subcategoriaId?: number;
  page?: number;
  limit?: number;
}) {
  return api<ListaPaginada<Conteudo>>(
    `/conteudos${query({ page: 1, limit: 12, ...opcoes })}`,
    { revalidar: 300 },
  );
}

/**
 * Conteúdos para ocupar a busca enquanto ninguém digitou nada.
 *
 * Começa pelos destaques da curadoria e completa com o catálogo geral: se
 * houver menos destaques que o limite, a tela ainda assim abre cheia. As duas
 * listagens são cacheadas por 300s, então isto não pesa na navegação.
 */
export async function sugestoesIniciais(limite = 12): Promise<Conteudo[]> {
  const [emDestaque, geral] = await Promise.all([
    listarConteudos({ destaque: true, limit: limite }),
    listarConteudos({ limit: limite }),
  ]);

  const vistos = new Set<number>();
  const reunidos: Conteudo[] = [];

  for (const conteudo of [...emDestaque.data, ...geral.data]) {
    if (vistos.has(conteudo.id)) continue;
    vistos.add(conteudo.id);
    reunidos.push(conteudo);
    if (reunidos.length === limite) break;
  }

  return reunidos;
}

/**
 * Ficha do conteúdo montada a partir da LISTAGEM, para quem a API barra no
 * detalhe.
 *
 * `GET /conteudos/{id}` recusa com 400 quem não tem acesso premium (visto em
 * `conteudo.service.ts → findOne`, que chama `temAcessoPremium` e lança antes
 * de devolver). Já `GET /conteudos` não faz essa checagem e traz os mesmos
 * campos que a página precisa: descrição, aprendizagem, requisitos, módulos,
 * aulas com duração e instrutores.
 *
 * Serve, então, para exibir a vitrine do conteúdo premium — o visitante
 * entende do que se trata o curso e só esbarra no bloqueio ao tentar assistir.
 * O que NÃO vem por aqui é o `rating` e a `url` de cada vídeo, ambos
 * calculados apenas no detalhe; nenhum dos dois é necessário sem reprodução.
 *
 * O acervo tem menos de uma centena de itens e a listagem é cacheada por 300s,
 * então varrer a primeira página sai barato e só acontece no caso bloqueado.
 */
export async function fichaPelaListagem(id: number): Promise<Conteudo | null> {
  const lista = await apiOpcional<ListaPaginada<Conteudo>>(
    `/conteudos${query({ page: 1, limit: 200 })}`,
    { revalidar: 300 },
  );

  return lista?.data.find((conteudo) => conteudo.id === id) ?? null;
}

/**
 * Ranking de mais assistidos sem podcasts, completado até `limite`.
 *
 * O ranking global (`/conteudos/top10` sem tipo) é o único com ordem real, mas
 * sobram menos de 10 depois de tirar os podcasts — na prática caiu para 7. Como
 * a API não devolve a contagem de acessos, não dá para reordenar nada por conta
 * própria; o que dá é buscar o top de cada tipo e usá-los para completar.
 *
 * A ordem resultante é honesta até onde vai o ranking global, e aproximada
 * depois: os itens acrescentados são de fato os mais assistidos do seu tipo,
 * só não se sabe como se intercalariam com os demais. Alternamos aula e
 * palestra ao completar para a cauda não pender toda para um tipo só — o
 * acervo tem 57 palestras contra 12 aulas.
 */
export async function maisAssistidosSemPodcast(limite = 10): Promise<Conteudo[]> {
  const [geral, aulas, palestras] = await Promise.all([
    listarTop10(),
    listarTop10({ tipo: "AULA" }),
    listarTop10({ tipo: "PALESTRA" }),
  ]);

  const vistos = new Set<number>();
  const ranking: Conteudo[] = [];

  const acrescentar = (itens: Conteudo[]) => {
    for (const conteudo of itens) {
      if (ranking.length >= limite) return;
      if (conteudo.tipo === "PODCAST" || vistos.has(conteudo.id)) continue;
      vistos.add(conteudo.id);
      ranking.push(conteudo);
    }
  };

  acrescentar(geral.data);

  const maiorLista = Math.max(aulas.data.length, palestras.data.length);
  for (let i = 0; i < maiorLista && ranking.length < limite; i += 1) {
    acrescentar(
      [aulas.data[i], palestras.data[i]].filter(
        (conteudo): conteudo is Conteudo => Boolean(conteudo),
      ),
    );
  }

  return ranking;
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

/** Propagandas ativas para exibir no app do usuário. */
/**
 * Configuração pública da plataforma, controlada pelo painel admin.
 *
 * `apiOpcional` de propósito: se a rota cair, a home tem de continuar de pé.
 * O padrão em caso de falha é mostrar o slide — esconder o topo da home por
 * causa de um timeout seria uma regressão pior que o inverso.
 */
export async function configPublica(): Promise<{ slideDestaqueAtivo: boolean }> {
  const resposta = await apiOpcional<{ slideDestaqueAtivo: boolean }>(
    "/app/publico",
    { revalidar: 60 },
  );
  return resposta ?? { slideDestaqueAtivo: true };
}

export async function listarPropagandas(): Promise<Propaganda[]> {
  const resposta = await apiOpcional<Propaganda[]>("/propagandas", {
    revalidar: 300,
  });
  return resposta ?? [];
}

/* ---------------- catálogo autenticado ---------------- */

/**
 * Detalhe do conteúdo. **Sem cache, de propósito.**
 *
 * A resposta embute `ProgressoVideo` já filtrado para o usuário logado — é dela
 * que saem a barra de continuação e o ponto em que o player retoma. Com os 120s
 * de revalidação que havia aqui, o `router.refresh()` disparado ao fechar o
 * player relia a mesma cópia guardada e a página continuava mostrando o
 * progresso anterior à sessão.
 *
 * O cache também rendia pouco: como o `Authorization` entra na chave do Data
 * Cache (ver `generateCacheKey` no Next), cada token gerava sua própria entrada
 * — nenhum usuário aproveitava a do outro, e o token muda a cada login.
 */
export function obterConteudo(id: number) {
  return api<Conteudo>(`/conteudos/${id}`, {
    autenticado: true,
    revalidar: false,
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

/**
 * Tudo que está em andamento, memoizado por requisição.
 *
 * É a fonte única de duas coisas que a home precisa: o trilho "Continue de onde
 * parou" e o mapa de progresso dos demais trilhos. Pedir as duas com limites
 * diferentes (10 e 100) gerava URLs diferentes, e portanto duas idas à API para
 * o mesmo dado — a memoização do `fetch` só une chamadas idênticas.
 *
 * Cem itens é o teto do acervo por usuário; quem quiser menos corta o resultado.
 */
export const progressoEmAndamento = cache(() => emAndamento(100));

/**
 * Mapa `conteudoId → percentual assistido`, para marcar com a barra de
 * continuação os cards que aparecem em qualquer listagem.
 *
 * Uma chamada serve a página inteira: sem ela, cada trilho precisaria cruzar o
 * próprio resultado com o progresso por conta própria. Devolve mapa vazio para
 * quem não está logado, porque `emAndamento` já engole o 401.
 */
export const mapaDeProgresso = cache(async (): Promise<Map<number, number>> => {
  const itens = await progressoEmAndamento();
  return new Map(itens.map((item) => [item.conteudoId, item.percentualAssistido]));
});

/** Situação de um episódio para o usuário logado. */
export type SituacaoEpisodio = {
  /** 0 a 100. */
  percentual: number;
  concluido: boolean;
};

/**
 * Quanto o usuário já ouviu de cada episódio, incluindo os TERMINADOS.
 *
 * `em-andamento` (que alimenta `mapaDeProgresso`) só devolve o que está abaixo
 * de 100%, então dentro dele "concluído" e "nunca ouvido" são a mesma ausência
 * — impossível marcar um episódio como ouvido.
 *
 * A fonte certa é `GET /progresso-video/situacao`, que resolve isso numa
 * chamada. Abaixo dele sobrevive o caminho antigo: pedir o detalhe de CADA
 * episódio só para ler a bandeira `concluido`. Eram 18 chamadas por abertura
 * da tela do podcast, com teto de 40 — em paralelo, então a espera era a de
 * uma só, mas o servidor levava 18. Some quando o endpoint estiver publicado
 * em todos os ambientes.
 */
const TETO_DETALHES = 40;

/**
 * `GET /progresso-video/situacao` — uma chamada com a situação de tudo que a
 * pessoa já tocou, concluídos inclusive.
 *
 * Endpoint novo. Enquanto não estiver publicado ele responde 404, e o
 * `apiOpcional` devolve null — daí a queda para o caminho antigo abaixo. Vale
 * apagar a queda depois que o backend subir.
 */
async function situacaoEmLote(): Promise<Map<number, SituacaoEpisodio> | null> {
  const resposta = await apiOpcional<{
    data: { conteudoId: number; percentual: number; concluido: boolean }[];
  }>("/progresso-video/situacao", { autenticado: true, revalidar: false });

  if (!resposta?.data) return null;

  return new Map(
    resposta.data.map((item) => [
      item.conteudoId,
      { percentual: item.percentual, concluido: item.concluido },
    ]),
  );
}

export async function situacaoDosEpisodios(
  ids: number[],
): Promise<Map<number, SituacaoEpisodio>> {
  /*
   * Caminho novo: uma chamada só. O leque abaixo é o antigo — mantido
   * enquanto o endpoint não está publicado em todos os ambientes.
   */
  const emLote = await situacaoEmLote();
  if (emLote) return emLote;

  const consultados = ids.slice(0, TETO_DETALHES);

  const respostas = await Promise.all(
    consultados.map(async (id) => {
      try {
        const conteudo = await obterConteudo(id);
        const video = conteudo.videos?.[0];
        const progresso = video?.ProgressoVideo?.[0];
        if (!video || !progresso) return null;

        const duracao = video.duracao ?? 0;
        const percentual =
          duracao > 0
            ? Math.min(Math.round((progresso.segundos / duracao) * 100), 100)
            : 0;

        return [
          id,
          { percentual, concluido: progresso.concluido },
        ] as const;
      } catch {
        // Episódio sem acesso ou fora do ar não deve derrubar a playlist.
        return null;
      }
    }),
  );

  return new Map(respostas.filter((par) => par !== null));
}

/**
 * Totais do usuário na plataforma inteira (tempo, vídeos e cursos concluídos).
 * Diferente de `em-andamento`, que só traz o que está abaixo de 100%.
 */
export function obterEstatisticas() {
  return apiOpcional<EstatisticasUsuario>("/progresso-video/estatisticas", {
    autenticado: true,
    revalidar: false,
  });
}

/**
 * Estatísticas detalhadas (consumo por tipo/categoria/instrutor, atividade,
 * coleções). Com `de`/`ate` (YYYY-MM-DD), restringe ao período; sem eles, tudo.
 */
export function obterEstatisticasDetalhadas(de?: string, ate?: string) {
  return apiOpcional<EstatisticasDetalhadas>(
    `/progresso-video/estatisticas/detalhado${query({ de, ate })}`,
    { autenticado: true, revalidar: false },
  );
}

export function assistidosRecentemente() {
  return apiOpcional<ProgressoVideo[]>("/progresso-video/recentes", {
    autenticado: true,
    revalidar: false,
  });
}

/**
 * Posição salva de um vídeo, ou `null` se ele nunca foi assistido — nesse caso
 * a API responde 200 com corpo vazio.
 *
 * Aceita `segundos` e `seconds` porque o nome do campo na spec já se provou
 * errado uma vez: o exemplo de `PATCH /progresso-video` documenta `seconds`, e
 * a validação da API recusa exatamente esse nome. Como a resposta do GET não
 * tem schema publicado, ler os dois evita depender de adivinhação.
 */
export async function progressoDoVideo(
  videoId: number,
): Promise<ProgressoVideo | null> {
  const bruto = await apiOpcional<{
    segundos?: number;
    seconds?: number;
    concluido?: boolean;
  }>(`/progresso-video/${videoId}`, { autenticado: true, revalidar: false });

  if (!bruto) return null;

  return {
    videoId,
    segundos: Math.max(0, Math.floor(bruto.segundos ?? bruto.seconds ?? 0)),
    concluido: Boolean(bruto.concluido),
  };
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
export async function listarSalvos(): Promise<Salvo[]> {
  const resposta = await apiOpcional<
    Salvo[] | Envelope<Salvo>
  >("/salvos", { autenticado: true, revalidar: false });

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

/** Lista completa de categorias — alimenta os filtros da busca. */
export function listarTodasCategorias() {
  return apiOpcional<Categoria[]>("/categorias/list", { revalidar: 3600 });
}

/** Subcategorias com `categoriaId`, para encadear os dois filtros. */
export function listarSubcategorias() {
  return apiOpcional<Subcategoria[]>("/subcategorias/list", { revalidar: 3600 });
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
 * Trilhas de aprendizado (formações) cadastradas pelo admin. É um catálogo
 * público — só vêm as publicadas — então dá para cachear como o resto do acervo.
 */
export async function listarTrilhas(): Promise<Trilha[]> {
  const resposta = await apiOpcional<Envelope<Trilha>>("/trilhas", {
    revalidar: 300,
  });
  return resposta?.data ?? [];
}

export function obterTrilha(id: number) {
  return apiOpcional<TrilhaDetalhe>(`/trilhas/${id}`, { revalidar: 300 });
}

/* ---------------- listas (do usuário) ---------------- */

/** As listas que o próprio usuário montou. Vazio para quem não está logado. */
export async function listarListas(): Promise<Lista[]> {
  const resposta = await apiOpcional<Envelope<Lista>>("/listas", {
    autenticado: true,
    revalidar: false,
  });
  return resposta?.data ?? [];
}

export function obterLista(id: number) {
  return apiOpcional<ListaDetalhe>(`/listas/${id}`, {
    autenticado: true,
    revalidar: false,
  });
}

/** Catálogo de conteúdos e aulas para montar uma lista. */
export function catalogoLista(
  opcoes: { q?: string; tipo?: TipoConteudo; page?: number; limit?: number } = {},
) {
  return apiOpcional<ListaPaginada<ConteudoCatalogo>>(
    `/listas/catalog${query({ page: 1, limit: 12, ...opcoes })}`,
    { autenticado: true, revalidar: false },
  );
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

/* -------------------------- notificações -------------------------- */

/**
 * Quantas notificações a pessoa ainda não leu.
 *
 * Só o número: é o que o cabeçalho precisa para desenhar o ponto no sino, e
 * carregar a lista inteira em toda navegação seria pagar caro por um contador.
 *
 * Qualquer erro vira zero. O cabeçalho aparece em TODA página da plataforma —
 * uma falha aqui não pode derrubar a navegação inteira por causa de um aviso.
 */
export async function contarNotificacoesNaoLidas(): Promise<number> {
  const resposta = await apiOpcional<{ naoLidas: number }>(
    "/notificacoes/nao-lidas",
    { autenticado: true, revalidar: false },
  );
  return resposta?.naoLidas ?? 0;
}

/* ------------------------------ club ------------------------------ */

/**
 * O time do dono do Club.
 *
 * `null` para QUALQUER erro da API, de propósito. O caso normal é 403 — a API
 * responde isso tanto para quem não tem o papel quanto para quem está com o
 * Club vencido —, e nos dois a aba simplesmente não é o caso da pessoa.
 *
 * Mas engolir o resto também é deliberado: esta chamada roda na página de
 * Configurações inteira, e uma API sem o módulo do Club responderia 404,
 * derrubando perfil, empresa e conta junto. Nenhum erro aqui justifica tirar
 * do ar as outras três abas — na dúvida, a pessoa não tem time.
 */
export async function obterMeuTime(): Promise<MeuTime | null> {
  try {
    return await api<MeuTime>("/club/time", {
      autenticado: true,
      revalidar: false,
    });
  } catch (erro) {
    if (erro instanceof ApiError) return null;
    throw erro;
  }
}

/**
 * Como o time do Club está usando a plataforma.
 *
 * Mesma tolerância do `obterMeuTime`: qualquer erro vira `null` e a aba some,
 * em vez de derrubar a página do Club inteira.
 */
export async function obterEstatisticasDoTime(de?: string, ate?: string) {
  return apiOpcional<EstatisticasDoTime>(
    `/club/estatisticas${query({ de, ate })}`,
    { autenticado: true, revalidar: false },
  );
}

/**
 * Dados públicos de um convite. Sem autenticação: quem abre o link ainda
 * pode nem ter conta.
 */
export async function obterConvite(
  token: string,
): Promise<ConvitePublico | null> {
  try {
    return await api<ConvitePublico>(
      `/club/convites/${encodeURIComponent(token)}`,
      { revalidar: false },
    );
  } catch (erro) {
    if (erro instanceof ApiError && erro.naoEncontrado) return null;
    throw erro;
  }
}

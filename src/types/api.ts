/**
 * Tipos derivados da spec OpenAPI da API DigitalEduca (docs/openapi.json)
 * e conferidos contra as respostas reais dos endpoints em 11/08/2026.
 *
 * Onde a spec e a resposta real divergem, o tipo segue a resposta real.
 */

export type TipoConteudo = "PALESTRA" | "PODCAST" | "AULA";
export type GratuitoTipo = "NENHUM" | "PERMANENTE" | "TEMPORARIO";
export type Role = "USER" | "SUPERADMIN" | "CORTESIA";
export type IntervaloPlano = "day" | "week" | "month" | "year";

/** A API usa três formatos de resposta diferentes; ver docs/API.md. */
export interface Paginacao {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListaPaginada<T> {
  data: T[];
  pagination: Paginacao;
}

export interface Envelope<T> {
  data: T[];
}

export interface Categoria {
  id: number;
  nome: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subcategoria {
  id: number;
  nome: string;
  categoriaId?: number;
}

export interface Tag {
  id: number;
  nome: string;
}

export interface Instrutor {
  id: number;
  nome: string;
  avatar: string | null;
  formacao: string | null;
  sobre?: string | null;
  totalConteudos?: number;
}

/** Vem aninhado dentro de Conteudo.instrutores como `{ instrutor: {...} }`. */
export interface ConteudoInstrutor {
  instrutor: Instrutor;
}

export interface Video {
  id: number;
  titulo: string;
  duracao: number | null;
  /**
   * Caminho do Vimeo no formato `/videos/1136993091`. Vem preenchido em
   * `GET /conteudos/{id}` (o `findOne` do backend faz select de `url`), mas
   * **não** na listagem `GET /conteudos`, que traz só id/título/duração.
   */
  url?: string | null;
  thumbnailUrl?: string | null;
  /**
   * Progresso do usuário logado, já filtrado pelo backend. Chega como array
   * com zero ou um item — evita uma chamada extra a `/progresso-video/{id}`.
   */
  ProgressoVideo?: { segundos: number; concluido: boolean }[];
  moduloId?: number | null;
  conteudoId?: number | null;
}

export interface Modulo {
  id: number;
  titulo: string;
  subtitulo?: string | null;
  descricao?: string | null;
  videos?: Video[];
}

export interface Conteudo {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: TipoConteudo;
  level: string | null;
  dataCriacao: string;
  /** Caminho no formato `/videos/1156627423` — o número é o ID no Vimeo. */
  videoIntrodutorio: string | null;
  thumbnailDesktop: string | null;
  thumbnailMobile: string | null;
  thumbnailDestaque: string | null;
  destaque: boolean;
  aprendizagem: string | null;
  requisitos: string | null;
  gratuitoTipo: GratuitoTipo;
  gratuitoAte: string | null;
  categoriaId: number;
  subcategoriaId: number;
  videos: Video[];
  modulos: Modulo[];
  instrutores: ConteudoInstrutor[];
  categoria?: Categoria;
  subcategoria?: Subcategoria;
  /** Presentes na resposta real, ausentes na spec. */
  rating?: number | null;
  duracao?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Forma reduzida usada nas árvores /categorias/freemium e /categorias/premium. */
export interface ConteudoResumo {
  id: number;
  categoriaId: number;
  titulo: string;
  descricao: string | null;
  tipo: TipoConteudo;
  level: string | null;
  gratuitoTipo: GratuitoTipo;
  gratuitoAte: string | null;
  thumbnailDesktop: string | null;
  thumbnailMobile: string | null;
  thumbnailDestaque: string | null;
  subcategoria?: Subcategoria;
}

export interface CategoriaComConteudos {
  id: number;
  categoria: string;
  subcategorias: {
    id: number;
    nome: string;
    conteudos: ConteudoResumo[];
  }[];
}

export interface TipoDisponivel {
  tipo: TipoConteudo;
  label: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  celular: string | null;
  role: Role;
  emailVerified?: boolean;
  cargo?: string | null;
  funcao?: string | null;
  areaAtuacao?: string | null;
  tempoExperiencia?: string | null;
  objetivoPlataforma?: string | null;
  formatoAprendizado?: string | null;
  aceitaNotificacoes?: boolean;
}

/**
 * Bloco `assinatura` de `GET /usuario/me`. Conferido no código do backend
 * (`usuario.service.ts → getUsuario`): a API só devolve a assinatura quando
 * ela está ATIVA e dentro do período, então a simples presença já significa
 * acesso válido. `metodoPagamento: "CORTESIA"` marca a cortesia concedida.
 */
export interface Assinatura {
  id: number;
  status?: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  valorPago?: number | null;
  metodoPagamento?: string | null;
  plano?: string | null;
  descricaoPlano?: string | null;
}

/**
 * `GET /usuario/me` devolve os campos do usuário no nível raiz (sem envelope)
 * mais `assinatura`. Atenção: **a `role` não vem** — o backend a remove com
 * `const { senha, role, assinaturas, ...resto } = usuario`. Por isso o front
 * não consegue identificar CORTESIA/SUPERADMIN por aqui; quem decide acesso a
 * conteúdo é sempre a API.
 */
export interface MeResponse extends Partial<Usuario> {
  assinatura?: Assinatura | null;
  [chave: string]: unknown;
}

export interface Plano {
  id: number;
  nome: string;
  preco: number;
  descricao: string | null;
  intervalo: IntervaloPlano;
  permiteParcelamento: boolean;
  maxParcelas: number;
  percentualDescontoAVista: number;
  priceId: string | null;
  stripeProductId: string | null;
}

export interface LoginResponse {
  access_token: string;
}

export interface ProgressoVideo {
  videoId: number;
  seconds: number;
  concluido?: boolean;
}

/**
 * Item de `GET /progresso-video/em-andamento`.
 *
 * Conferido em `progresso-video.service.ts`: o endpoint devolve
 * `{ data: [...] }` — e não o array puro que o exemplo do Swagger mostra.
 * Cada item já vem com título, capas e duração, então não é preciso cruzar
 * com o catálogo.
 *
 * Atenção a `progresso`: é uma FRAÇÃO de 0 a 1. O valor pronto para a barra
 * é `percentualAssistido` (0 a 100).
 */
export interface ConteudoEmAndamento {
  conteudoId: number;
  titulo: string;
  tipo: TipoConteudo;
  gratuitoTipo: GratuitoTipo;
  gratuitoAte: string | null;
  thumbnailMobile: string | null;
  thumbnailDesktop: string | null;
  thumbnail: string | null;
  duracao: number;
  segundosAssistidos: number;
  progresso: number;
  percentualAssistido: number;
  updatedAt: string;
}

/**
 * Resposta de `GET /vimeo-client/video/{id}/link`.
 *
 * `url` é o melhor link disponível (HLS quando existe, senão MP4) — mas o link
 * HLS do Vimeo **não termina em `.m3u8`**, então não dá para inferir o formato
 * pela URL. O array `sources` traz o `type` declarado e é ele que o player usa.
 */
/** `GET /negocio/me` — um por usuário, criado uma única vez. */
export interface Negocio {
  id?: number;
  nomeEmpresa: string | null;
  setorAtuacao: string | null;
  numeroColaboradores: string | null;
  faixaFaturamentoAnual: string | null;
  faseAtual: string | null;
  desafiosNegocio: string | null;
}

/** `GET /interesse/me` — usado pela API para recomendar conteúdo. */
export interface Interesse {
  id?: number;
  temasAprender: string | null;
  dificuldadeAtual: string | null;
  nivelConhecimento: string | null;
  tempoDisponivelSemana: string | null;
  estiloAprendizado: string | null;
}

/** Item de `GET /conteudos-selecionados`. O `id` é do vínculo, não do conteúdo. */
export interface ConteudoSelecionado {
  id: number;
  conteudoId?: number;
  conteudo: Conteudo;
}

/** `GET /avaliacao-video/{videoId}` → média geral. */
export interface AvaliacaoMedia {
  media: number;
  total: number;
}

/** `GET /avaliacao-video/user/{videoId}` → nota do usuário (ou `{nota: null}`). */
export interface AvaliacaoUsuario {
  nota: number | null;
}

/** `GET /tags/{id}` — os conteúdos vêm aninhados no vínculo. */
export interface TagDetalhe {
  id: number;
  nome: string;
  conteudos: { conteudoId: number; conteudo: Conteudo }[];
}

/** `GET /instrutor/{id}/perfil` */
export interface PerfilInstrutor {
  instrutor: Instrutor;
  data: Conteudo[];
  pagination?: Paginacao;
}

export interface VimeoFonte {
  id: string;
  label: string;
  quality: string;
  type: "hls" | "mp4" | string;
  url: string;
}

export interface VimeoLink {
  url: string;
  quality?: string;
  defaultQuality?: string;
  sources?: VimeoFonte[];
  textTracks?: unknown[];
}

/**
 * Trilhas. A spec OpenAPI não declara schema nem exemplo para estes endpoints
 * (`CreateAutoTrailDto`, `CreateManualTrailDto` e `UpdateTrailProgressDto`
 * aparecem vazios), então os campos abaixo são opcionais e a leitura passa
 * pelo normalizador em `queries.ts`. Confirmar com o backend antes de escrever.
 */
export interface Trilha {
  id: number;
  titulo: string;
  descricao: string | null;
  progresso: number | null;
  totalItens: number | null;
  concluidos: number | null;
}

/** Forma bruta aceita pelo normalizador, cobrindo as variações prováveis. */
export interface TrilhaBruta {
  id?: number | string;
  titulo?: string;
  nome?: string;
  title?: string;
  name?: string;
  descricao?: string | null;
  description?: string | null;
  progresso?: number | null;
  progress?: number | null;
  totalItens?: number | null;
  totalItems?: number | null;
  itens?: unknown[];
  items?: unknown[];
  concluidos?: number | null;
  completed?: number | null;
  [chave: string]: unknown;
}

/**
 * Tipos derivados da spec OpenAPI da API DigitalEduca (docs/openapi.json)
 * e conferidos contra as respostas reais dos endpoints em 11/08/2026.
 *
 * Onde a spec e a resposta real divergem, o tipo segue a resposta real.
 */

/**
 * Os quatro tipos do enum do banco.
 *
 * `AULA` é exibida como **MasterClass** desde 20/08/2026, mas o VALOR continua
 * `AULA`: ele é contrato de API com o app mobile já instalado, que compara a
 * string. O nome novo é só apresentação — vive em `ROTULOS_TIPO`, nunca aqui.
 */
export type TipoConteudo = "PALESTRA" | "PODCAST" | "AULA" | "CURSO";
export type GratuitoTipo = "NENHUM" | "PERMANENTE" | "TEMPORARIO";
export type Role = "USER" | "SUPERADMIN" | "CORTESIA" | "CLUB";
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

/** Propaganda/banner (`GET /propagandas`) — imagem que leva a um link. */
export interface Propaganda {
  id: number;
  titulo: string | null;
  imagem: string;
  link: string;
}

/** Vem aninhado dentro de Conteudo.instrutores como `{ instrutor: {...} }`. */
export type PapelInstrutor = "INSTRUTOR" | "APRESENTADOR" | "CONVIDADO";

export interface ConteudoInstrutor {
  /** Papel no conteúdo — em podcasts distingue apresentador de convidado. */
  papel?: PapelInstrutor;
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
  /**
   * Quem apresenta o episódio, em `conteudos.apresentador` — texto puro, com
   * os nomes separados por vírgula quando são mais de um.
   *
   * Não é um vínculo com Instrutor desde 19/08/2026: apresentador virado
   * registro de instrutor entrava na vitrine pública com a formação em branco.
   * Cadastros anteriores a essa data ainda têm o vínculo `APRESENTADOR`, então
   * as duas origens convivem — ver `pessoasDoEpisodio`.
   */
  apresentador?: string | null;
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
  avatar?: string | null;
  emailVerified?: boolean;
  cargo?: string | null;
  funcao?: string | null;
  areaAtuacao?: string | null;
  tempoExperiencia?: string | null;
  objetivoPlataforma?: string | null;
  formatoAprendizado?: string | null;
  aceitaNotificacoes?: boolean;
}

/** Alguém já dentro do time — `GET /club/time`. */
export interface MembroDoTime {
  id: number;
  nome: string;
  email: string;
  avatar: string | null;
  emailVerified: boolean;
  createdAt: string;
}

/** Convite ainda em aberto. Ocupa vaga do mesmo jeito que um membro. */
export interface ConviteDoTime {
  id: number;
  nome: string;
  email: string;
  token: string;
  expiraEm: string;
  /**
   * Falso quando o e-mail não pôde ser enviado. A tela então mostra o link
   * para o dono entregar por fora — o convite existe de qualquer jeito.
   */
  emailEnviado: boolean;
  createdAt: string;
}

/** `GET /club/time` — o painel do dono do Club. */
export interface MeuTime {
  /**
   * Falso quando a participação venceu. A tela continua abrindo — é ela que
   * explica por que o time parou —, mas convidar fica travado.
   */
  ativo: boolean;
  /** Período da associação. Nulo quando nunca houve um gravado. */
  periodo: {
    dataInicio: string;
    dataFim: string | null;
    status: string;
  } | null;
  limite: number;
  membros: MembroDoTime[];
  convites: ConviteDoTime[];
  vagasUsadas: number;
  vagasRestantes: number;
}

/** `GET /club/convites/:token` — dados públicos da tela de aceite. */
export interface ConvitePublico {
  nome: string;
  email: string;
  convidadoPor: string;
  expiraEm: string;
  /** Quando falso, o e-mail já tem conta e o aceite não pede senha. */
  precisaCriarConta: boolean;
  situacao: "ABERTO" | "ACEITO" | "CANCELADO" | "EXPIRADO" | "CLUB_ENCERRADO";
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
  /*
   * `segundos`, e não `seconds`: o exemplo do OpenAPI para `PATCH
   * /progresso-video` mostra o nome em inglês, mas a validação da API recusa
   * esse campo. Vale para o corpo enviado e para o que ela devolve.
   */
  segundos: number;
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

/** Item de `GET /salvos`. O `id` é do vínculo, não do conteúdo. */
export interface Salvo {
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

/*
 * Trilhas — contratos lidos direto do backend (`src/trilhas/`), já que a spec
 * OpenAPI publica os três DTOs vazios.
 */

/**
 * Trilha de aprendizado (formação), cadastrada pelo admin: uma sequência
 * ordenada de conteúdos. O usuário só consome. Resumo de `GET /trilhas`.
 */
export interface Trilha {
  id: number;
  titulo: string;
  descricao: string | null;
  nivel: string | null;
  destaque: boolean;
  publicada: boolean;
  thumbnailMobile: string | null;
  thumbnailDesktop: string | null;
  thumbnailDestaque: string | null;
  totalConteudos: number;
  createdAt: string;
  updatedAt: string;
}

/** Um conteúdo dentro da trilha, na ordem definida pelo admin. */
export interface ConteudoDaTrilha {
  ordem: number;
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: TipoConteudo;
  level: string | null;
  gratuitoTipo: GratuitoTipo;
  thumbnailMobile: string | null;
  thumbnailDesktop: string | null;
  thumbnailDestaque: string | null;
}

/** `GET /trilhas/{id}` — a formação com seus conteúdos ordenados. */
export interface TrilhaDetalhe extends Trilha {
  conteudos: ConteudoDaTrilha[];
}

export type StatusLista = "NAO_INICIADA" | "EM_ANDAMENTO" | "CONCLUIDA" | string;
export type StatusItemLista = "BLOQUEADO" | "EM_ANDAMENTO" | "CONCLUIDO";

/** Lista do usuário (`GET /listas`): uma sequência de aulas montada por ele. */
export interface Lista {
  id: number;
  titulo: string;
  descricao: string | null;
  status: StatusLista;
  progressoPercent: number;
  aulasConcluidas: number;
  totalAulas: number;
  tempoAssistidoSegundos: number;
  tempoRestanteSegundos: number;
  sequenciaDias: number;
  thumbnailUrl: string | null;
  thumbnailDesktopUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Uma aula dentro da lista. O progresso é independente do progresso global. */
export interface ItemLista {
  id: number;
  orderIndex: number;
  videoId: number;
  conteudoId?: number;
  titulo: string;
  moduloTitulo?: string | null;
  conteudoTitulo?: string | null;
  descricao?: string | null;
  tipo?: TipoConteudo;
  /** true quando o usuário precisa assinar para abrir esta aula. */
  requerAssinatura: boolean;
  thumbnailUrl: string | null;
  thumbnailDesktopUrl: string | null;
  duracaoSegundos: number;
  segundosAssistidos: number;
  progressoPercent: number;
  concluido: boolean;
  progressoAtualizadoEm: string | null;
  status: StatusItemLista;
  vimeoUri: string | null;
}

/** `GET /listas/{id}` — a lista com suas aulas na ordem escolhida. */
export interface ListaDetalhe extends Lista {
  items: ItemLista[];
}

/** `GET /progresso-video/estatisticas` — totais do usuário na plataforma. */
export interface EstatisticasUsuario {
  segundosAssistidos: number;
  videosConcluidos: number;
  cursosFinalizados: number;
  conteudosEmAndamento: number;
  ultimaAtividade: string | null;
}

/** `GET /progresso-video/estatisticas/detalhado` — para a página de estatísticas. */
export interface EstatisticasDetalhadas extends EstatisticasUsuario {
  membroDesde: string | null;
  diasAtivos: number;
  porTipo: {
    tipo: TipoConteudo;
    videos: number;
    concluidos: number;
    segundos: number;
  }[];
  porCategoria: { nome: string; videos: number; segundos: number }[];
  porInstrutor: { nome: string; avatar: string | null; segundos: number }[];
  porMes: { mes: string; videos: number; diasAtivos: number }[];
  /** dia: 0 = domingo … 6 = sábado. */
  diaSemanaPico: { dia: number; videos: number } | null;
  listasCriadas: number;
  salvos: number;
  avaliacoesFeitas: number;
  mediaNotasDadas: number | null;
}

/** Aula disponível no catálogo de montagem manual. */
export interface AulaCatalogo {
  videoId: number;
  titulo: string;
  moduloTitulo: string | null;
  duracaoSegundos: number;
}

/** `GET /trilhas/catalog` — conteúdos com suas aulas, paginado. */
export interface ConteudoCatalogo {
  id: number;
  titulo: string;
  tipo: TipoConteudo;
  thumbnailUrl: string | null;
  categoria: string | null;
  totalAulas: number;
  aulas: AulaCatalogo[];
}

/** Respostas do questionário — todas obrigatórias em `POST /trilhas/auto`. */
export interface RespostasTrilha {
  objetivo: string;
  areaInteresse: string;
  nivelAtual: string;
  tempoDisponivel: string;
  preferencia: string;
  objetivoFinal: string;
  titulo?: string;
}

/**
 * Resposta de `GET /vimeo-client/video/{id}/link`.
 *
 * `url` é o melhor link disponível (HLS quando existe, senão MP4) — mas o link
 * HLS do Vimeo **não termina em `.m3u8`**, então não dá para inferir o formato
 * pela URL. O array `sources` traz o `type` declarado e é ele que o player usa.
 */
/** Legenda disponível para o vídeo. `proxyUrl` é a rota autenticada da API. */
export interface VimeoLegenda {
  id: string;
  label: string;
  language: string;
  kind: string;
  url: string | null;
  proxyUrl: string;
  autogenerated: boolean;
}

export interface VimeoLink {
  url: string;
  quality?: string;
  defaultQuality?: string;
  sources?: VimeoFonte[];
  textTracks?: VimeoLegenda[];
}

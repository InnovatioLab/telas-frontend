/**
 * Interface base para DTOs de request
 */
export interface IBaseRequestDto {
  /**
   * Timestamp da requisição
   */
  timestamp?: string;

  /**
   * ID da requisição para rastreamento
   */
  requestId?: string;

  /**
   * Versão da API
   */
  apiVersion?: string;
}

/**
 * Interface base para DTOs de response
 */
export interface IBaseResponseDto<T = any> {
  /**
   * Indica se a operação foi bem-sucedida
   */
  success: boolean;

  /**
   * Dados da resposta
   */
  data?: T;

  /**
   * Mensagem da resposta
   */
  message?: string;

  /**
   * Código de erro se houver
   */
  errorCode?: string;

  /**
   * Timestamp da resposta
   */
  timestamp: string;

  /**
   * ID da requisição para rastreamento
   */
  requestId?: string;
}

/**
 * Interface para DTOs de paginação
 */
export interface IPaginationDto {
  /**
   * Página atual
   */
  page: number;

  /**
   * Tamanho da página
   */
  size: number;

  /**
   * Total de elementos
   */
  total: number;

  /**
   * Total de páginas
   */
  totalPages: number;

  /**
   * Indica se há próxima página
   */
  hasNext: boolean;

  /**
   * Indica se há página anterior
   */
  hasPrevious: boolean;
}

/**
 * Interface para response paginada
 */
export interface IPaginatedResponseDto<T> extends IBaseResponseDto<T[]> {
  /**
   * Informações de paginação
   */
  pagination: IPaginationDto;
}

/**
 * Interface para DTOs de filtro
 */
export interface IBaseFilterDto {
  /**
   * Termo de busca
   */
  search?: string;

  /**
   * Campo para ordenação
   */
  sortBy?: string;

  /**
   * Direção da ordenação
   */
  sortDirection?: 'asc' | 'desc';

  /**
   * Página
   */
  page?: number;

  /**
   * Tamanho da página
   */
  size?: number;
}

/**
 * Interface para DTOs de validação
 */
export interface IValidationDto {
  /**
   * Indica se é válido
   */
  isValid: boolean;

  /**
   * Lista de erros
   */
  errors: IValidationError[];

  /**
   * Lista de warnings
   */
  warnings: IValidationWarning[];
}

/**
 * Interface para erros de validação
 */
export interface IValidationError {
  /**
   * Campo com erro
   */
  field: string;

  /**
   * Mensagem de erro
   */
  message: string;

  /**
   * Código do erro
   */
  code: string;

  /**
   * Valor que causou o erro
   */
  value?: any;
}

/**
 * Interface para warnings de validação
 */
export interface IValidationWarning {
  /**
   * Campo com warning
   */
  field: string;

  /**
   * Mensagem de warning
   */
  message: string;

  /**
   * Código do warning
   */
  code: string;
}

/**
 * Interface para DTOs de arquivo
 */
export interface IFileDto {
  /**
   * ID do arquivo
   */
  id: string;

  /**
   * Nome do arquivo
   */
  name: string;

  /**
   * Tipo do arquivo
   */
  type: string;

  /**
   * Tamanho do arquivo em bytes
   */
  size: number;

  /**
   * URL do arquivo
   */
  url: string;

  /**
   * Data de upload
   */
  uploadedAt: string;

  /**
   * Hash do arquivo
   */
  hash?: string;
}

/**
 * Interface para DTOs de endereço
 */
export interface IAddressDto {
  /**
   * ID do endereço
   */
  id?: string;

  /**
   * CEP
   */
  zipCode: string;

  /**
   * Logradouro
   */
  street: string;

  /**
   * Número
   */
  number: string;

  /**
   * Complemento
   */
  complement?: string;

  /**
   * Bairro
   */
  neighborhood: string;

  /**
   * Cidade
   */
  city: string;

  /**
   * Estado
   */
  state: string;

  /**
   * País
   */
  country: string;

  /**
   * Latitude
   */
  latitude?: number;

  /**
   * Longitude
   */
  longitude?: number;

  /**
   * Indica se é endereço principal
   */
  isPrimary?: boolean;
}

/**
 * Interface para DTOs de contato
 */
export interface IContactDto {
  /**
   * ID do contato
   */
  id?: string;

  /**
   * Nome do contato
   */
  name: string;

  /**
   * Email
   */
  email: string;

  /**
   * Telefone
   */
  phone?: string;

  /**
   * Cargo
   */
  position?: string;

  /**
   * Indica se é contato principal
   */
  isPrimary?: boolean;
}

/**
 * Interface para DTOs de erro
 */
export interface IErrorDto {
  /**
   * Código do erro
   */
  code: string;

  /**
   * Mensagem do erro
   */
  message: string;

  /**
   * Detalhes adicionais
   */
  details?: any;

  /**
   * Stack trace (apenas em desenvolvimento)
   */
  stack?: string;

  /**
   * Timestamp do erro
   */
  timestamp: string;
}



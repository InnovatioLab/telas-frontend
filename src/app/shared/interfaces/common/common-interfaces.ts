/**
 * Interfaces comuns utilizadas em todo o projeto
 */

/**
 * Interface para entidades com ID
 */
export interface IEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface para entidades com auditoria
 */
export interface IAuditableEntity extends IEntity {
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
}

/**
 * Interface para entidades com status
 */
export interface IStatusEntity extends IEntity {
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
}

/**
 * Interface para entidades com soft delete
 */
export interface ISoftDeleteEntity extends IEntity {
  isDeleted: boolean;
  deletedAt?: string;
}

/**
 * Interface para paginação
 */
export interface IPagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Interface para ordenação
 */
export interface ISort {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Interface para filtros básicos
 */
export interface IBaseFilter {
  search?: string;
  sort?: ISort;
  pagination?: IPagination;
}

/**
 * Interface para resultado de operação
 */
export interface IOperationResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

/**
 * Interface para configuração de coluna de tabela
 */
export interface ITableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency';
  format?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Interface para configuração de formulário
 */
export interface IFormConfig {
  fields: IFormField[];
  validation?: IFormValidation;
  layout?: IFormLayout;
}

/**
 * Interface para campo de formulário
 */
export interface IFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: IFormFieldOption[];
  validation?: IFieldValidation;
}

/**
 * Interface para opção de campo
 */
export interface IFormFieldOption {
  value: any;
  label: string;
  disabled?: boolean;
}

/**
 * Interface para validação de campo
 */
export interface IFieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

/**
 * Interface para validação de formulário
 */
export interface IFormValidation {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showErrors?: boolean;
}

/**
 * Interface para layout de formulário
 */
export interface IFormLayout {
  columns?: number;
  gap?: string;
  direction?: 'row' | 'column';
}

/**
 * Interface para configuração de modal
 */
export interface IModalConfig {
  title?: string;
  width?: string;
  height?: string;
  closable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
  modal?: boolean;
  dismissableMask?: boolean;
}

/**
 * Interface para configuração de toast
 */
export interface IToastConfig {
  severity?: 'success' | 'info' | 'warn' | 'error';
  summary?: string;
  detail?: string;
  life?: number;
  closable?: boolean;
  sticky?: boolean;
}

/**
 * Interface para configuração de loading
 */
export interface ILoadingConfig {
  message?: string;
  showSpinner?: boolean;
  overlay?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Interface para configuração de busca
 */
export interface ISearchConfig {
  placeholder?: string;
  debounceTime?: number;
  minLength?: number;
  maxLength?: number;
  showClear?: boolean;
  showSuggestions?: boolean;
}

/**
 * Interface para item de menu
 */
export interface IMenuItem {
  id: string;
  label: string;
  icon?: string;
  routerLink?: string;
  command?: () => void;
  items?: IMenuItem[];
  disabled?: boolean;
  visible?: boolean;
  badge?: string;
  badgeClass?: string;
}

/**
 * Interface para configuração de rota
 */
export interface IRouteConfig {
  path: string;
  component?: any;
  loadChildren?: () => Promise<any>;
  canActivate?: any[];
  canDeactivate?: any[];
  data?: any;
  resolve?: any;
}

/**
 * Interface para configuração de guard
 */
export interface IGuardConfig {
  canActivate?: boolean;
  canDeactivate?: boolean;
  canLoad?: boolean;
  canActivateChild?: boolean;
}

/**
 * Interface para configuração de interceptor
 */
export interface IInterceptorConfig {
  request?: (req: any) => any;
  response?: (res: any) => any;
  error?: (error: any) => any;
}

/**
 * Interface para configuração de cache
 */
export interface ICacheConfig {
  key: string;
  ttl?: number;
  maxSize?: number;
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

/**
 * Interface para configuração de API
 */
export interface IApiEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
  retry?: number;
}

/**
 * Interface para configuração de ambiente
 */
export interface IEnvironment {
  production: boolean;
  apiUrl: string;
  version: string;
  buildDate: string;
  features: Record<string, boolean>;
}








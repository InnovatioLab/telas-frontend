import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export class ApiErrorHandler {
  static readonly GENERIC_FORBIDDEN_MESSAGE =
    'You do not have permission to perform this operation.';

  private static firstMessageFromBody(body: unknown): string | null {
    if (!body || typeof body !== 'object') {
      return null;
    }
    const o = body as Record<string, unknown>;
    const direct =
      (typeof o.message === 'string' && o.message.trim()) ||
      (typeof o.message === 'string' && o.message.trim()) ||
      null;
    if (direct) {
      return direct;
    }
    const errors = o.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (typeof first === 'string' && first.trim().length > 0) {
        return first.trim();
      }
    }
    return null;
  }

  static handleApiError(error: HttpErrorResponse): string {
    const isLoginRequest = error.url?.includes('auth/login') ?? false;
    if (!environment.production && !isLoginRequest) {
      console.error('API Error:', error);
    }

    if (error.status === 401 || error.status === 403) {
      const fromBody = ApiErrorHandler.firstMessageFromBody(error.error);
      if (fromBody) {
        return fromBody;
      }
      return ApiErrorHandler.GENERIC_FORBIDDEN_MESSAGE;
    }

    if (error.status === 422) {
      const fromBody = ApiErrorHandler.firstMessageFromBody(error.error);
      if (fromBody) {
        return fromBody;
      }
      const body = error.error as {
        detail?: unknown;
      } | undefined;
      if (body?.detail) {
        const validationErrors = body.detail;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          const first = validationErrors[0] as { msg?: string };
          return first.msg ? `Validation error: ${first.msg}` : 'Invalid data or resource unavailable.';
        }
      }
      return 'Invalid data or resource unavailable.';
    }

    if (error.status === 404) {
      return 'Resource not found.';
    }

    if (error.status === 0) {
      return 'Connection error with the server. Check your internet.';
    }

    if (error.status >= 500) {
      return 'Internal server error. Please try again later.';
    }

    return 'An error occurred while communicating with the server.';
  }

  static getMensagemContextualizada(error: HttpErrorResponse, contexto: string, recurso?: string): string {
    const mensagemBase = this.handleApiError(error);
    const nomeRecurso = recurso || 'resource';

    const operacoes: { [key: string]: string } = {
      'excluir': `Error deleting ${nomeRecurso}.`,
      'carregar': `Error loading ${nomeRecurso}.`,
      'salvar': `Error saving ${nomeRecurso}.`,
      'atualizar': `Error updating ${nomeRecurso}.`,
      'obter': `Error getting details of ${nomeRecurso}.`,
      'enviar': `Error sending ${nomeRecurso}.`,
      'processar': `Error processing ${nomeRecurso}.`,
    };

    const prefixo = operacoes[contexto] || `Error in ${contexto} operation.`;

    if (contexto === 'excluir') {
      if (error.status === 422) {
        return `${nomeRecurso} inválido ou já excluído.`;
      }
      if (error.status === 401 || error.status === 403) {
        return `Você não tem permissão para excluir este ${nomeRecurso}.`;
      }
    }

    if (contexto === 'salvar' || contexto === 'atualizar') {
      if (error.status === 422) {
        return `Dados inválidos para ${nomeRecurso}.`;
      }
    }

    return `${prefixo} ${mensagemBase}`;
  }
}

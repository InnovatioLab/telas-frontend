import { HttpErrorResponse } from '@angular/common/http';

export class ApiErrorHandler {
  static handleApiError(error: HttpErrorResponse): string {
    console.error('API Error:', error);

    if (error.status === 401 || error.status === 403) {
      return 'You do not have permission to perform this operation.';
    }

    if (error.status === 422) {
      if (error.error?.detail) {
        const validationErrors = error.error.detail;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          return `Validation error: ${validationErrors[0].msg}`;
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

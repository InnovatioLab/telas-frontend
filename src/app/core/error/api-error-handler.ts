import { HttpErrorResponse } from '@angular/common/http';

export class ApiErrorHandler {
  static handleApiError(error: HttpErrorResponse): string {
    console.error('API Error:', error);

    if (error.status === 401 || error.status === 403) {
      return 'Você não tem permissão para realizar esta operação.';
    }

    if (error.status === 422) {
      if (error.error?.detail) {
        const validationErrors = error.error.detail;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          return `Erro de validação: ${validationErrors[0].msg}`;
        }
      }
      return 'Dados inválidos ou recurso indisponível.';
    }

    if (error.status === 404) {
      return 'Recurso não encontrado.';
    }

    if (error.status === 0) {
      return 'Erro de conexão com o servidor. Verifique sua internet.';
    }

    if (error.status >= 500) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }

    return 'Ocorreu um erro na comunicação com o servidor.';
  }

  /**
   * Retorna a mensagem específica para um determinado contexto de erro
   * @param error Objeto de erro HTTP
   * @param contexto Contexto da operação (ex: "excluir", "carregar")
   * @param recurso Nome do recurso envolvido na operação (opcional)
   * @returns Mensagem de erro contextualizada
   */
  static getMensagemContextualizada(error: HttpErrorResponse, contexto: string, recurso?: string): string {
    const mensagemBase = this.handleApiError(error);
    const nomeRecurso = recurso || 'recurso';

    const operacoes: { [key: string]: string } = {
      'excluir': `Erro ao excluir ${nomeRecurso}.`,
      'carregar': `Erro ao carregar ${nomeRecurso}.`,
      'salvar': `Erro ao salvar ${nomeRecurso}.`,
      'atualizar': `Erro ao atualizar ${nomeRecurso}.`,
      'obter': `Erro ao obter detalhes do ${nomeRecurso}.`,
      'enviar': `Erro ao enviar ${nomeRecurso}.`,
      'processar': `Erro ao processar ${nomeRecurso}.`,
    };

    const prefixo = operacoes[contexto] || `Erro na operação de ${contexto}.`;

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

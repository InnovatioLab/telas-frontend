export class DateFormatter {
  static formatarDataBR(date: string | Date | undefined): string {
    if (!date) return '';

    try {
      const dataObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dataObj.getTime())) return '';

      return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  }

  static formatarDataHoraBR(date: string | Date | undefined): string {
    if (!date) return '';

    try {
      const dataObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dataObj.getTime())) return '';

      return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data e hora:', error);
      return '';
    }
  }
}

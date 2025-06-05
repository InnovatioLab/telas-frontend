export class AuthenticationStorage {
  static readonly storageName = 'telas_token';

  static getToken() {
    return localStorage.getItem(this.storageName);
  }

  static setToken(token: string) {
    localStorage.setItem(this.storageName, token);
  }

  static getRefreshToken() {
    return localStorage.getItem(this.storageName + '_refresh');
  }

  static setRefreshToken(token: string) {
    localStorage.setItem(this.storageName + '_refresh', token);
  }

  static clearToken() {
    localStorage.removeItem(this.storageName);
    localStorage.removeItem(this.storageName + '_refresh');
    localStorage.removeItem(this.storageName + '_user');
    localStorage.removeItem('telas_carrinho_state');
  }

  static getDataUser() {
    return localStorage.getItem(this.storageName + '_user');
  }

  static setDataUser(data: string) {
    localStorage.setItem(this.storageName + '_user', data);
  }

  static getIdentificationNumber() {
    const userData = this.getDataUser();
    return userData ? JSON.parse(userData).identificationNumber : null;
  }

  static getBusinessName() {
    const userData = this.getDataUser();
    return userData ? JSON.parse(userData).businessName : null;
  }

  static getUserId(): string | null {
    try {
      const userData = this.getDataUser();
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      return user?.id || null;
    } catch (error) {
      console.error('Erro ao obter ID do usuário:', error);
      return null;
    }
  }
}

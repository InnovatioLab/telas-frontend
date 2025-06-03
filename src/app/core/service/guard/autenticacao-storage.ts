export class AutenticacaoStorage {
  static readonly storageName = 'chatbot_ematece_token';

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
  }

  static loginExpirado() {
    localStorage.removeItem(this.storageName);
    localStorage.removeItem(this.storageName + '_refresh');
    localStorage.removeItem(this.storageName + '_user');
  }

  static getDataUser() {
    return localStorage.getItem(this.storageName + '_user');
  }

  static setDataUser(data: string) {
    localStorage.setItem(this.storageName + '_user', data);
  }
}

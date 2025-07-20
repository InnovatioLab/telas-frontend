export class MenuView {
  fotoPerfil: string;
  nomeUsuario: string;
  cargoUsuario: string;
  menuItems: MenuItem[];

  constructor(dados: IMenuView) {
    this.fotoPerfil = 'https://api.dicebear.com/9.x/initials/svg?seed=' + dados.nomeUsuario;
    this.nomeUsuario = dados.nomeUsuario;
    this.cargoUsuario = dados.cargoUsuario;
    this.menuItems = [
      { label: 'Dashboard', icon: 'dashboard', navegacao: '/dashboard' },
      { label: 'Documents', icon: 'documentos', navegacao: '/documentos' },
      { label: 'Logout', icon: 'sair', navegacao: '/logout' },
    ];
  }

}

export interface IMenuView {
  nomeUsuario: string;
  cargoUsuario: string;
}

interface MenuItem {
  label: string;
  icon: string;
  navegacao: string;
}

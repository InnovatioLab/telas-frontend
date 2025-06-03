export class MenuView {
  fotoPerfil: string;
  nomeUsuario: string;
  cargoUsuario: string;
  menuItems: MenuItem[];

  constructor(dados: IMenuView) {
    this.fotoPerfil = 'https://api.dicebear.com/9.x/initials/svg?seed=' + dados.nomeUsuario; // Caminho padrão para a foto de perfil
    this.nomeUsuario = dados.nomeUsuario;
    this.cargoUsuario = dados.cargoUsuario;
    this.menuItems = [
      { label: 'Painel Inicial ', icon: 'dashboard', navegacao: '/dashboard' },
      { label: 'Documentos', icon: 'documentos', navegacao: '/documentos' },
      { label: 'Sair', icon: 'sair', navegacao: '/logout' },
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

export const USER_TYPE_STEPS: Record<string, string[]> = {
  CLIENT: ['dadosCadastrais', 'contato'],
};

export const ALL_STEPS: { key: string; label: string; command: () => void }[] = [
  {
    key: 'dadosCadastrais',
    label: 'Registration Data',
    command: () => {}
  }
];

export const userFriendlyNames: Record<string, string> = {
  CLIENT: 'Customer Registration',
};

export const gerenciarNames: Record<string, string> = {
  PERFIL: 'Perfil',
  DADOSCADASTRAIS: 'Dados Cadastrais',
  CONTATO: 'Contato',
  DADOSPRESIDENTE: 'Dados do Presidente',
  OUTRASINFORMACOES: 'Outras Insformações',
  DOCUMENTOS: 'Documentos'
};

export const abasNavegador = {
  PERFIL: 'perfil',
  DADOSCADASTRAIS: 'dados-cadastrais',
  CONTATO: 'contato',
  DADOSPRESIDENTE: 'dados-presidente',
  OUTRASINFORMACOES: 'outras-informacoes',
  DOCUMENTOS: 'documentos'
};

export const MENSAGENS: MensagensConstants = {
  dialogo: {
    avisoLoginIncorreto: "Incorrect data! Review and try again.",
    cancelarEditar:
      "Are you sure you want to cancel? All<br/>information filled will be lost.",
    cancelarEditarMobile:
      "Are you sure you want to cancel?<br/>All information filled will be lost.",
    tokenInvalido: "Authentication failure: Token missing, invalid or expired",
    clientNaoEncontrado: "Client not found!",
    envioCodigoValidacaoEmail:
      "<s>We sent a validation code to {var}. <br/> Please enter the code to confirm your data.</s> <br/>If you cannot find the email in your inbox, check your spam or junk folder.",
    cancelar:
      "Are you sure you want to leave? This action will discard all data filled in the form.",
    jaPossuiContaRetomarCadastro:
      "The email is already registered!<br>If you are having trouble accessing your account, try recovering your password on the login screen or contact our support:<br><b>{{var}}</b>",
    recusarTermo:
      "By not accepting the Terms of Acceptance, you<br/> will be prevented from logging into the system.",
    recusarTermoMobile:
      "By not accepting the Terms of<br/>Acceptance, you will be prevented <br/> from logging into the system.",
    senhaRedefinida:
      "Password successfully reset!<br/>You can access the platform with your new password.",
    cancelarRedefinirSenha:
      "Are you sure you want to cancel? This action will discard all data filled in the form.",
    reenvioCodigoValidacao:
      "A new code has been sent to your contact email! Check and try again.",
    cadastroRealizadoSucesso:
      "Registration successfully completed!<br/>Welcome to Telas",
    naoEncontradoIdentificador: "Identifier not found!",
    cancelarEditarSenha:
      "Do you really want to leave? The data filled for password change will not be saved.",
  },
  validacao: {
    senhasNaoCorrespondem: "Passwords do not match.",
    senhaAtualIgualNova:
      "The current password and the new password must be different!",
  },
};

export interface MensagensConstants {
  dialogo: {
    avisoLoginIncorreto: string;
    cancelarEditar: string;
    cancelarEditarMobile: string;
    tokenInvalido: string;
    clientNaoEncontrado: string;
    envioCodigoValidacaoEmail: string;
    cancelar: string;
    jaPossuiContaRetomarCadastro: string;
    recusarTermo: string;
    recusarTermoMobile: string;
    cancelarRedefinirSenha: string;
    senhaRedefinida: string;
    reenvioCodigoValidacao: string;
    cadastroRealizadoSucesso: string;
    naoEncontradoIdentificador: string;
    cancelarEditarSenha: string;
  };
  validacao: {
    senhaAtualIgualNova: string;
    senhasNaoCorrespondem: string;
  };
}

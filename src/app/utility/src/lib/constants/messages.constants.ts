export const MESSAGES: MessagesConstants = {
  dialog: {
    incorrectLoginWarning: "Incorrect data! Review and try again.",
    cancelEdit:
      "Are you sure you want to cancel? All<br/>information filled will be lost.",
    cancelEditMobile:
      "Are you sure you want to cancel?<br/>All information filled will be lost.",
    invalidToken: "Authentication failure: Token missing, invalid or expired",
    clientNotFound: "Client not found!",
    validationCodeSentEmail:
      "<s>We sent a validation code to {var}. <br/> Please enter the code to confirm your data.</s> <br/>If you cannot find the email in your inbox, check your spam or junk folder.",
    cancel:
      "Are you sure you want to leave? This action will discard all data filled in the form.",
    emailAlreadyRegistered:
      "The email is already registered!<br>If you are having trouble accessing your account, try recovering your password on the login screen or contact our support:<br><b>{{var}}</b>",
    declineTerms:
      "By not accepting the Terms of Acceptance, you<br/> will be prevented from logging into the system.",
    declineTermsMobile:
      "By not accepting the Terms of<br/>Acceptance, you will be prevented <br/> from logging into the system.",
    passwordReset:
      "Password successfully reset!<br/>You can access the platform with your new password.",
    cancelPasswordReset:
      "Are you sure you want to cancel? This action will discard all data filled in the form.",
    resendValidationCode:
      "A new code has been sent to your contact email! Check and try again.",
    registrationSuccess:
      "Registration successfully completed!<br/>Welcome to Telas",
    identifierNotFound: "Identifier not found!",
    cancelPasswordEdit:
      "Do you really want to leave? The data filled for password change will not be saved.",
  },
  validation: {
    passwordsMismatch: "Passwords do not match.",
    currentPasswordSameAsNew:
      "The current password and the new password must be different!",
  },
};

export interface MessagesConstants {
  dialog: {
    incorrectLoginWarning: string;
    cancelEdit: string;
    cancelEditMobile: string;
    invalidToken: string;
    clientNotFound: string;
    validationCodeSentEmail: string;
    cancel: string;
    emailAlreadyRegistered: string;
    declineTerms: string;
    declineTermsMobile: string;
    cancelPasswordReset: string;
    passwordReset: string;
    resendValidationCode: string;
    registrationSuccess: string;
    identifierNotFound: string;
    cancelPasswordEdit: string;
  };
  validation: {
    currentPasswordSameAsNew: string;
    passwordsMismatch: string;
  };
}

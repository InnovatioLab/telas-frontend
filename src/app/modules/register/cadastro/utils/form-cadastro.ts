import { FormBuilder, FormGroup } from "@angular/forms";
import { ClientProfileFormFactory } from "@app/shared/forms/client-profile-form.factory";

export class FormCadastro {
  cadastroForm: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.cadastroForm = ClientProfileFormFactory.createCadastroForm(this.fb);
  }
}

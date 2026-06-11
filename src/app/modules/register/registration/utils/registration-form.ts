import { FormBuilder, FormGroup } from "@angular/forms";
import { ClientProfileFormFactory } from "@app/shared/forms/client-profile-form.factory";

export class RegistrationForm {
  registrationForm: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.registrationForm = ClientProfileFormFactory.createRegistrationForm(this.fb);
  }
}

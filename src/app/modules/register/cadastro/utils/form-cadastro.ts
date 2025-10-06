import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AbstractControlUtils } from "@app/shared/utils/abstract-control.utils";

export class FormCadastro {
  cadastroForm: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.cadastroForm = this.fb.group({
      dadosCliente: this.fb.group({
        businessName: ["", [Validators.required, Validators.maxLength(255)]],
        identificationNumber: [
          "",
          [
            Validators.required,
            Validators.minLength(9),
            Validators.maxLength(9),
            Validators.pattern(/^\d{9}$/),
          ],
        ],
        industry: ["", [Validators.required, Validators.maxLength(50)]],
        websiteUrl: [
          "",
          [Validators.maxLength(255), AbstractControlUtils.validateUrl()],
        ],
        socialMedia: this.fb.array([]),
      }),
      owner: this.fb.group({
        ownerIdentificationNumber: [
          "",
          [
            Validators.required,
            Validators.minLength(9),
            Validators.maxLength(9),
            Validators.pattern(/^\d{9}$/),
          ],
        ],
        firstName: ["", [Validators.required, Validators.maxLength(50)]],
        lastName: ["", [Validators.maxLength(150)]],
        ownerEmail: ["", [Validators.email, Validators.maxLength(255)]],
        phone: ["", [AbstractControlUtils.validatePhone()]],
      }),
      enderecoCliente: this.fb.group({
        zipCode: ["", [Validators.required, Validators.pattern(/^\d{5}$/)]],
        street: [
          "",
          [
            Validators.required,
            Validators.maxLength(100),
            AbstractControlUtils.validateStreet(),
          ],
        ],
        city: ["", [Validators.required, Validators.maxLength(50)]],
        state: [
          "",
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(2),
          ],
        ],
        country: ["US", [Validators.maxLength(100)]],
        complement: ["", [Validators.maxLength(100)]],
      }),
      contato: this.fb.group({
        numeroContato: [
          "",
          [Validators.required, AbstractControlUtils.validatePhone()],
        ],
        email: [
          "",
          [Validators.required, Validators.email, Validators.maxLength(255)],
        ],
      }),
    });
  }
}

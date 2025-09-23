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
          [Validators.maxLength(200), Validators.pattern(/^(https?:\/\/).+/)],
        ],
        socialMedia: this.fb.array([]),
      }),
      enderecoCliente: this.fb.group({
        zipCode: ["", [Validators.required, Validators.pattern(/^\d{5}$/)]],
        street: [
          "",
          [
            Validators.required,
            Validators.maxLength(100),
            AbstractControlUtils.validateAddress(),
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
          [
            Validators.required,
            Validators.minLength(11),
            Validators.maxLength(11),
          ],
        ],
        email: [
          "",
          [Validators.required, Validators.email, Validators.maxLength(255)],
        ],
      }),
    });
  }
}

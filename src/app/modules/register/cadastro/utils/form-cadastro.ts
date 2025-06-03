import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export class FormCadastro {
  cadastroForm: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.cadastroForm = this.fb.group({
      dadosCliente: this.fb.group({
        businessName: ['', [Validators.required, Validators.maxLength(100)]],
        identificationNumber: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern(/^\d{9}$/)]],
        industry: ['', [Validators.required, Validators.maxLength(100)]],
        websiteUrl: ['', [Validators.maxLength(200), Validators.pattern(/^(https?:\/\/).+/)]],
        socialMedia: this.fb.array([])
      }),
      enderecoCliente: this.fb.group({
        zipCode: ['', [Validators.required]],
        street: ['', [Validators.required, Validators.maxLength(100)]],
        city: ['', [Validators.required, Validators.maxLength(50)]],
        state: ['', [Validators.required, Validators.maxLength(2)]],
        country: ['', [Validators.required, Validators.maxLength(100)]],
        complement: ['', [Validators.maxLength(100)]]
      }),
      contato: this.fb.group({
        numeroContato: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]]
      })
    });
  }
}

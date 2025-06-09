import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AlterarSenhaComponent } from './alterar-senha.component';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthenticationService } from '@raizes-cearenses-nx/authentication-data-access';
import { Router } from '@angular/router';
import { Authentication } from '@raizes-cearenses-nx/authentication-data-access';
import { of, throwError } from 'rxjs';
import { User, UserService } from '@raizes-cearenses-nx/user';
import { LoadingService } from '@raizes-cearenses-nx/shared-ui';

describe('AlterarSenhaComponent', () => {
  let component: AlterarSenhaComponent;
  let formBuilder: FormBuilder;
  let authenticationServiceMock: {
    alterarSenha: jest.Mock;
  };
  let authenticationMock: {
    helperJwt: {
      decodeToken: jest.Mock;
    };
    token: string;
    user: User;
  };
  let userServiceMock;

  beforeEach(() => {
    authenticationServiceMock = {
      alterarSenha: jest.fn().mockReturnValue(of({}))
    };

    userServiceMock = {
      cancelarEdicao$: jest.fn().mockReturnValue(of(true))
    };

    authenticationMock = {
      helperJwt: {
        decodeToken: jest.fn().mockReturnValue({ login: 'testLogin' })
      },
      token: 'testToken',
      user: { usuario: { id: '123' } }
    };

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        DialogService,
        { provide: AuthenticationService, useValue: authenticationServiceMock },
        { provide: Authentication, useValue: authenticationMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: {} }
      ]
    });

    formBuilder = TestBed.inject(FormBuilder);
    component = new AlterarSenhaComponent(
      formBuilder,
      TestBed.inject(DialogService),
      TestBed.inject(AuthenticationService),
      TestBed.inject(Authentication),
      TestBed.inject(Router),
      TestBed.inject(UserService),
      TestBed.inject(LoadingService)
    );
  });

  it('deve retornar true quando as senhas são diferentes', () => {
    component.form.get('novaSenha').setValue('novaSenha123');
    component.form.get('confirmarNovaSenha').setValue('diferenteSenha123');
    component.form.get('confirmarNovaSenha').markAsDirty();

    expect(component.exibirErroSenhaDiferente()).toBe(true);
  });

  it('deve retornar false quando as senhas são iguais', () => {
    component.form.get('novaSenha').setValue('novaSenha123');
    component.form.get('confirmarNovaSenha').setValue('novaSenha123');
    component.form.get('confirmarNovaSenha').markAsDirty();

    expect(component.exibirErroSenhaDiferente()).toBe(false);
  });

  it('deve retornar true quando a nova senha é igual à senha atual', () => {
    component.form.get('senhaAtual').setValue('senhaAtual123');
    component.form.get('novaSenha').setValue('senhaAtual123');
    component.form.get('senhaAtual').markAsDirty();

    expect(component.exibirErroSenhaAtualIgualNova()).toBe(true);
  });

  it('deve retornar false quando a nova senha é diferente da senha atual', () => {
    component.form.get('senhaAtual').setValue('senhaAtual123');
    component.form.get('novaSenha').setValue('novaSenha123');
    component.form.get('senhaAtual').markAsDirty();

    expect(component.exibirErroSenhaAtualIgualNova()).toBe(false);
  });

  it('deve retornar true quando há erros no campo novaSenha e exibirErroSenhaAtualIgualNova retorna false', () => {
    component.form.get('novaSenha').setErrors({ required: true });
    jest.spyOn(component, 'exibirErroSenhaAtualIgualNova').mockReturnValue(false);

    expect(component.exibirErrosPadraoCampoNovaSenha()).toBe(true);
  });

  it('deve retornar false quando não há erros no campo novaSenha ou exibirErroSenhaAtualIgualNova retorna true', () => {
    component.form.get('novaSenha').setErrors(null);
    jest.spyOn(component, 'exibirErroSenhaAtualIgualNova').mockReturnValue(true);

    expect(component.exibirErrosPadraoCampoNovaSenha()).toBe(false);
  });

  it('deve retornar true quando a nova senha atende ao tamanho mínimo e exibirErroSenhaAtualIgualNova retorna false', () => {
    component.form.get('novaSenha').setValue('novaSenha123');
    jest.spyOn(component, 'exibirErroSenhaAtualIgualNova').mockReturnValue(false);

    expect(component.exibirRequisitoSenha()).toBe(true);
  });

  it('deve retornar false quando a nova senha não atende ao tamanho mínimo ou exibirErroSenhaAtualIgualNova retorna true', () => {
    component.form.get('novaSenha').setValue('123');
    jest.spyOn(component, 'exibirErroSenhaAtualIgualNova').mockReturnValue(true);

    expect(component.exibirRequisitoSenha()).toBe(false);
  });

  it('deve marcar o formulário como tocado e retornar se o formulário for inválido', () => {
    component.form.get('novaSenha').setValue('');
    component.salvar();
    expect(component.form.touched).toBe(true);
  });

  it('deve retornar se exibirErroSenhaAtualIgualNova ou exibirErroSenhaDiferente retornarem true', () => {
    jest.spyOn(component, 'exibirErroSenhaAtualIgualNova').mockReturnValue(true);
    component.salvar();
    expect(authenticationServiceMock.alterarSenha).not.toHaveBeenCalled();

    jest.spyOn(component, 'exibirErroSenhaAtualIgualNova').mockReturnValue(false);
    jest.spyOn(component, 'exibirErroSenhaDiferente').mockReturnValue(true);
    component.salvar();
    expect(authenticationServiceMock.alterarSenha).not.toHaveBeenCalled();
  });

  it('deve chamar alterarSenha do authenticationService com os valores corretos quando o formulário é válido', () => {
    component.form.get('senhaAtual').setValue('senhaAtual123');
    component.form.get('novaSenha').setValue('novaSenha123');
    component.form.get('confirmarNovaSenha').setValue('novaSenha123');

    component.user = { usuario: { id: '123' } };

    jest.spyOn(component, 'exibirErroSenhaAtualIgualNova').mockReturnValue(false);
    jest.spyOn(component, 'exibirErroSenhaDiferente').mockReturnValue(false);

    component.salvar();

    expect(authenticationServiceMock.alterarSenha).toHaveBeenCalled();
  });

  it('deve chamar exibirMensagemSucesso no caso de sucesso', () => {
    jest.spyOn(component, 'exibirMensagemSucesso');
    component.user = { usuario: { id: '123' } };

    component.form.get('senhaAtual').setValue('senhaAtual123');
    component.form.get('novaSenha').setValue('novaSenha123');
    component.form.get('confirmarNovaSenha').setValue('novaSenha123');

    jest.spyOn(component, 'exibirErroSenhaAtualIgualNova').mockReturnValue(false);
    jest.spyOn(component, 'exibirErroSenhaDiferente').mockReturnValue(false);

    component.salvar();

    expect(component.exibirMensagemSucesso).toHaveBeenCalled();
  });

  it('deve definir o erro senhaInvalida no campo senhaAtual no caso de erro 401', () => {
    authenticationServiceMock.alterarSenha.mockReturnValue(throwError({ status: 401 }));
    component.user = { usuario: { id: '123' } };

    component.form.get('senhaAtual').setValue('senhaAtual123');
    component.form.get('novaSenha').setValue('novaSenha123');
    component.form.get('confirmarNovaSenha').setValue('novaSenha123');

    jest.spyOn(component, 'exibirErroSenhaAtualIgualNova').mockReturnValue(false);
    jest.spyOn(component, 'exibirErroSenhaDiferente').mockReturnValue(false);

    component.salvar();

    expect(component.form.get('senhaAtual').hasError('senhaInvalida')).toBe(true);
  });
});

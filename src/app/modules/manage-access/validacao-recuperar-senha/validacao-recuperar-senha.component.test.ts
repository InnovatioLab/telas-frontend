import { ValidacaoRecuperaSenhaComponent } from './validacao-recuperar-senha.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { UserService } from '@raizes-cearenses-nx/user';
import { DialogService } from 'primeng/dynamicdialog';
import { RouterTestingModule } from '@angular/router/testing';
import { ENVIRONMENT } from '@raizes-cearenses-nx/environment';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '@raizes-cearenses-nx/authentication-data-access';

describe('ValidacaoRecuperaSenhaComponent', () => {
  let component: ValidacaoRecuperaSenhaComponent;
  let fixture: ComponentFixture<ValidacaoRecuperaSenhaComponent>;
  let userServiceMock = {
    validarCodigo: jest.fn(),
    reenvioCodigo: jest.fn()
  };
  let dialogServiceMock = {
    open: jest.fn()
  };
  let activatedRouteMock;
  let httpClientMock: {
    post: jest.Mock;
    patch: jest.Mock;
    get: jest.Mock;
    delete: jest.Mock;
  };

  let authServiceMock: {
    recuperarSenha: jest.Mock;
  };

  beforeEach(async () => {
    userServiceMock = {
      validarCodigo: jest.fn(),
      reenvioCodigo: jest.fn()
    };

    authServiceMock = {
      recuperarSenha: jest.fn().mockReturnValue(of(null))
    };

    httpClientMock = {
      post: jest.fn(),
      patch: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    };

    dialogServiceMock = {
      open: jest.fn()
    };

    activatedRouteMock = {
      paramMap: of({
        get: () => '07537234337'
      })
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule, ValidacaoRecuperaSenhaComponent],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: DialogService, useValue: dialogServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: ENVIRONMENT, useValue: { apiUrl: 'http://example.com/' } },
        { provide: HttpClient, useValue: httpClientMock },
        { provide: AuthenticationService, useValue: authServiceMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidacaoRecuperaSenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('Deve clicar em voltar', () => {
    const spyon = jest.spyOn(component, 'voltar');
    const btn = fixture.debugElement.nativeElement.querySelector('#botao-voltar');
    btn.click();
    expect(spyon).toHaveBeenCalled();
  });

  it('Deve inicializar o formulário de validação', () => {
    expect(component.validacaoForm).toBeDefined();
    expect(component.validacaoForm.get('codigo')).toBeDefined();
  });

  it('Deve obter o parâmetro login da URL', () => {
    expect(component.usuarioLogin).toBe('07537234337');
  });

  it('Deve disparar erro com formulário invalido', () => {
    const spyon = jest.spyOn(component, 'validarCodigo');

    component.validacaoForm.get('codigo').setValue('');

    component.validarCodigo();

    expect(spyon).toHaveBeenCalled();
  });

  it('Deve validar o código quando o formulário for válido', () => {
    const codigo = '123456';
    component.validacaoForm.get('codigo').setValue(codigo);
    userServiceMock.validarCodigo.mockReturnValue(of({}));

    component.validarCodigo();

    expect(userServiceMock.validarCodigo).toHaveBeenCalledWith('07537234337', codigo);
  });

  it('Deve reenviar o código quando o botão for clicado', () => {
    authServiceMock.recuperarSenha.mockReturnValue(of({}));

    component.enviarCodigo();

    expect(authServiceMock.recuperarSenha).toHaveBeenCalledWith('07537234337');
  });
});

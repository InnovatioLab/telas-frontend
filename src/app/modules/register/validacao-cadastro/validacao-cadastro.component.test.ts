import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ValidacaoCadastroComponent } from './validacao-cadastro.component';
import { UserService } from '@raizes-cearenses-nx/user';
import { DialogService } from 'primeng/dynamicdialog';
import { RouterTestingModule } from '@angular/router/testing';
import { ENVIRONMENT } from '@raizes-cearenses-nx/environment';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '@raizes-cearenses-nx/authentication-data-access';

describe('ValidacaoCadastroComponent', () => {
  let component: ValidacaoCadastroComponent;
  let fixture: ComponentFixture<ValidacaoCadastroComponent>;
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
    login: jest.Mock;
  };

  beforeEach(async () => {
    userServiceMock = {
      validarCodigo: jest.fn(),
      reenvioCodigo: jest.fn()
    };

    authServiceMock = {
      login: jest.fn().mockReturnValue(of(null))
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
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        ValidacaoCadastroComponent
      ],
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
    fixture = TestBed.createComponent(ValidacaoCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve inicializar o formulário de validação', () => {
    expect(component.validacaoForm).toBeDefined();
    expect(component.validacaoForm.get('codigo')).toBeDefined();
  });

  it('deve obter o parâmetro login da URL', () => {
    expect(component.usuarioLogin).toBe('07537234337');
  });

  it('deve validar o código quando o formulário for válido', () => {
    const codigo = '123456';
    component.validacaoForm.get('codigo').setValue(codigo);
    userServiceMock.validarCodigo.mockReturnValue(of({}));

    component.validarCodigo();

    expect(userServiceMock.validarCodigo).toHaveBeenCalledWith(
      '07537234337',
      codigo
    );
  });

  it('deve reenviar o código quando o botão for clicado', () => {
    userServiceMock.reenvioCodigo.mockReturnValue(of({}));

    component.enviarCodigo();

    expect(userServiceMock.reenvioCodigo).toHaveBeenCalledWith('07537234337');
  });

  it('deve redirecionar para alterar contato principal quando o botão for clicado', () => {
    const routerSpy = jest.spyOn(component['router'], 'navigate');

    component.redirecionarAlterarContato();

    expect(routerSpy).toHaveBeenCalledWith([
      '/cadastro/alterar-contato/07537234337'
    ]);
  });

  it('deve chamar fazerLogin ao finalizar cadastro de senha', () => {
    const fazerLoginSpy = jest.spyOn(component, 'fazerLogin');
    const senha = 'senhaExemplo';

    component.cadastroSenhaFinalizado(senha);

    expect(fazerLoginSpy).toHaveBeenCalledWith(senha);
  });

  it('deve fazer login e exibir termos', () => {
    const senha = 'senhaExemplo';

    component.fazerLogin(senha);

    expect(authServiceMock.login).toHaveBeenCalledWith(
      component.usuarioLogin,
      senha
    );
    expect(component.exibirTermos).toBe(true);
  });
});

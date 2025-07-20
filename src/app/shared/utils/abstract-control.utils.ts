import { AbstractControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
export class AbstractControlUtils {
  static desativarCampo(form: FormGroup, campo: string): void {
    form.get(campo).disable();
  }

  static desativarLimparCampo(form: FormGroup, campo: string): void {
    form.get(campo).disable();
    form.get(campo).reset();
    form.get(campo).clearValidators();
    form.get(campo).updateValueAndValidity();
  }

  static ativarCampo(form: FormGroup, campo: string): void {
    form.get(campo).enable();
  }

  static ativarCampos(form: FormGroup, campos: string[]): void {
    campos.forEach(campo => form.get(campo).enable());
  }

  static tornarControlsObrigatorios(form: FormGroup, campos: string[]): void {
    campos.forEach(campo => {
      form.get(campo).setValidators(Validators.required);
      form.get(campo).updateValueAndValidity();
    });
  }

  static tornarControlObrigatorio(form: FormGroup, campo: string): void {
    form.get(campo).setValidators(Validators.required);
    form.get(campo).updateValueAndValidity();
  }

  static removerControlsObrigatorios(form: FormGroup, campos: string[]): void {
    campos.forEach(campo => {
      form.get(campo).removeValidators(Validators.required);
      form.get(campo).updateValueAndValidity();
    });
  }

  static removerControlObrigatorio(form: FormGroup, campo: string): void {
    form.get(campo).removeValidators(Validators.required);
    form.get(campo).updateValueAndValidity();
  }

  static atualizatualizarValidators(form: FormGroup, campo: string, validators: ValidatorFn | ValidatorFn[]): void {
    form.get(campo).setValidators(validators);
    form.get(campo).updateValueAndValidity();
  }

  static atualizarValorCampo(form: FormGroup, campo: string, valor: string | string[] | number | Date | null): void {
    form.get(campo).patchValue(valor);
  }

  static removerMascaraCPF(form: FormGroup): string {
    const campoCpf = form.get('cpf');
    const cpfFormatado: string = campoCpf.value.replaceAll(/[.-]/g, '');
    campoCpf.setValue(cpfFormatado);
    return cpfFormatado;
  }

  static formatarDataHoraBR(dataHora: string): string {
    if (!dataHora) {
      return '-';
    }

    const data = new Date(dataHora);
    return data
      .toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace(',', ' às');
  }

  static converterStringParaData(dataString: string): Date | null {
    if (!dataString) {
      return null;
    }

    const partes = dataString.split('-');
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);

    return new Date(ano, mes, dia);
  }

  static ativarCamposETornarObrigatorio(form: FormGroup, controls: string[]): void {
    controls.forEach(control => {
      form.get(control).enable();
      form.get(control).setValidators(Validators.required);
      form.get(control).updateValueAndValidity();
    });
  }

  static ativarCampoETornarObrigatorio(form: FormGroup, control: string): void {
    form.get(control).enable();
    form.get(control).setValidators(Validators.required);
    form.get(control).updateValueAndValidity();
  }

  static desativarLimparCampos(form: FormGroup, controls: string[]): void {
    controls.forEach(control => {
      form.get(control).disable();
      form.get(control).reset();
      form.get(control).clearValidators();
      form.get(control).updateValueAndValidity();
    });
  }

  static setValidators(form: FormGroup, control: string, validador: ValidatorFn | ValidatorFn[] | null): void {
    form.get(control).setValidators(validador);
    form.get(control).updateValueAndValidity();
  }

  static limparCampo(form: FormGroup, campo: string): void {
    form.get(campo).reset();
  }

  static limparCampos(form: FormGroup, campo: string[]): void {
    campo.forEach(campo => {
      const control = form.get(campo);
      if (control) {
        control.reset();
      }
    });
  }

  static formularioModificado(formularioAtual: FormGroup, formularioInicial: FormGroup): boolean {
    const cadastroFormJson = JSON.stringify(formularioAtual.value);
    const formularioInicialJson = JSON.stringify(formularioInicial.value);
    return cadastroFormJson == formularioInicialJson;
  }

  static resetFormExcludingField(formularioAtual: FormGroup, excetoName: string) {
    Object.keys(formularioAtual.controls).forEach(key => {
      if (key !== excetoName) {
        formularioAtual.get(key)?.reset();
      }
    });
  }

  static verificarCampoRequired(form: FormGroup, campo: string) {
    const control = form.get(campo);
    if (control?.validator) {
      const validatorFn = control.validator({} as AbstractControl);
      if (validatorFn && 'required' in validatorFn) {
        return true;
      }
    }
    return false;
  }

  static verificarCampoInvalidoTocado(form: FormGroup, campo: string) {
    if (form.get(campo)) {
      return form.get(campo)?.invalid && form.get(campo)?.touched;
    }
    return false;
  }

  static aceitarApenasTexto(form: FormGroup, campo: string): void {
    form.get(campo)?.valueChanges.subscribe(nome => {
      const lettersRegex = /^[\p{L}\s.,-]*$/u;
      if (!lettersRegex.test(nome)) {
        form.get(campo).setValue(nome.slice(0, -1));
      }
    });
  }

  static adicionaArquivoEmLista(form: FormGroup, campo: string, file: File): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const arrArquivos = form.get(campo)?.value ?? [];
      arrArquivos.push({
        nome: file.name,
        bytes: reader.result,
        tipo: file.type
      });
      form.get(campo).setValue(arrArquivos);
      form.updateValueAndValidity();
    };
  }

  static removerArquivoDaLista(form: FormGroup, campo: string, index: number): void {
    const arrArquivos = form.get(campo)?.value ?? [];
    arrArquivos.splice(index, 1);
    form.get(campo).setValue(arrArquivos);
    form.updateValueAndValidity();
  }
}

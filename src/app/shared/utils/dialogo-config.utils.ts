import { Injectable } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { IConfigDialogo } from '../interfaces/dialog-config.interface';

@Injectable({
  providedIn: 'root'
})
export class DialogoUtils {
  static criarConfig(data: IConfigDialogo): DynamicDialogConfig {
    return {
      data,
      showHeader: false,
      modal: true,
      breakpoints: {
        '640px': '90vw'
      },
      baseZIndex: 10000
    };
  }

  static exibirSucesso(descricao: string, config?: IConfigDialogo): DynamicDialogConfig {
    const data: IConfigDialogo = {
      ...config,
      titulo: 'Sucesso!',
      descricao,
      icon: 'check_circle',
      acaoPrimaria: 'Ok'
    };

    return {
      data: data,
      showHeader: false,
      modal: true,
      breakpoints: {
        '640px': '90vw'
      },
      baseZIndex: 10000
    };
  }

  static exibirAlerta(descricao: string, config?: IConfigDialogo): DynamicDialogConfig {
    const data: IConfigDialogo = {
      titulo: 'Alerta!',
      icon: 'report',
      ...config,
      descricao,
      acaoPrimaria: config?.acaoPrimaria ?? 'Ok'
    };

    return {
      data: data,
      showHeader: false,
      modal: true,
      closeOnEscape: false,
      breakpoints: {
        '640px': '90vw'
      },
      baseZIndex: 10000
    };
  }
}

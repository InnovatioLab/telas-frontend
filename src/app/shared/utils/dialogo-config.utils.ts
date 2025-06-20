import { Injectable } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { IConfigDialogo } from '../interfaces/dialog-config.interface';
import { IconCheckComponent } from '../icons/check.icon';
import { IconWarningComponent } from '../icons/warning.icon';

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
      icon: IconCheckComponent,
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
      icon: IconWarningComponent,
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

import { Injectable } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { IDialogConfig } from '../interfaces/dialog-config.interface';

@Injectable({
  providedIn: 'root'
})
export class DialogUtils {
  static createConfig(data: IDialogConfig): DynamicDialogConfig {
    return {
      data,
      showHeader: false,
      modal: true,
      breakpoints: {
        '500px': '90vw'
      },
      baseZIndex: 10000
    }
  }

  static showSuccess(description: string, config?: IDialogConfig): DynamicDialogConfig {
    const data: IDialogConfig = {
      ...config,
      title: 'Success!',
      description,
      icon: 'check_circle',
      iconClass: 'success',
      primaryAction: 'Ok'
    };

    return {
      data: data,
      showHeader: false,
      modal: true,
      breakpoints: {
        '500px': '90vw'
      },
      baseZIndex: 10000
    };
  }

  static showAlert(description: string, config?: IDialogConfig): DynamicDialogConfig {
    const data: IDialogConfig = {
      title: "Alert!",
      icon: "warning",
      iconClass: "alert",
      ...config,
      description,
      primaryAction: config?.primaryAction ?? "Ok",
    };

    return {
      data: data,
      showHeader: false,
      modal: true,
      closeOnEscape: false,
      breakpoints: {
        '500px': '90vw'
      },
      baseZIndex: 10000
    };
  }
}

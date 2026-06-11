import { Type } from '@angular/core';

export interface IDialogConfig {
  title?: string;
  description?: string;
  icon?: string | Type<any>;
  iconClass?: string;
  primaryAction?: string;
  secondaryAction?: string;
  primaryActionCallback?: () => void;
  secondaryActionCallback?: () => void;
}

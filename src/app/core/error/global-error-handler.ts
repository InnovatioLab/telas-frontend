import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from '../service/state/toast.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toastService = inject(ToastService);

  handleError(error: any): void {
    const errorMessage = this.extractErrorMessage(error);
    this.toastService.erro(errorMessage);
    this.logError(error);
  }

  private extractErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.error?.detail) {
      return error.error.detail;
    }
    if (error?.message) {
      return error.message;
    }
    if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
      return error.errors[0];
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }

  private logError(error: any): void {
    const errorInfo: any = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (error?.error) {
      errorInfo.httpError = {
        status: error.status,
        statusText: error.statusText,
        url: error.url
      };
    }

    if (!environment.production) {
      console.error('Error logged:', errorInfo);
    }
  }
}


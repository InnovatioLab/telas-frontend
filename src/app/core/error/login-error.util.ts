import { HttpErrorResponse } from '@angular/common/http';

export type LoginErrorPhase = 'credentials' | 'profile';

export class LoginFlowError extends Error {
  constructor(
    message: string,
    readonly phase: LoginErrorPhase,
    readonly status?: number
  ) {
    super(message);
    this.name = 'LoginFlowError';
  }
}

export function isLoginFlowError(error: unknown): error is LoginFlowError {
  return error instanceof LoginFlowError;
}

export function resolveLoginFlowError(
  error: unknown,
  phase: LoginErrorPhase
): LoginFlowError {
  if (error instanceof LoginFlowError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const bodyMessage = extractApiMessage(error);
    const status = error.status;

    if (phase === 'credentials') {
      if (status === 401 || status === 422) {
        return new LoginFlowError(
          bodyMessage ?? 'Invalid email or password.',
          phase,
          status
        );
      }
      if (status === 403) {
        return new LoginFlowError(
          bodyMessage ??
            'Access denied. Confirm you are using the partner email address provided by Telas.',
          phase,
          status
        );
      }
      if (status === 0) {
        return new LoginFlowError(
          'Unable to reach the server. Check your connection and try again.',
          phase,
          status
        );
      }
      return new LoginFlowError(
        bodyMessage ?? 'Unable to sign in. Please try again.',
        phase,
        status
      );
    }

    if (status === 403) {
      return new LoginFlowError(
        bodyMessage ??
          'Your account cannot be loaded. Contact Telas support if this continues.',
        phase,
        status
      );
    }
    if (status === 401) {
      return new LoginFlowError(
        'Session could not be started. Please try signing in again.',
        phase,
        status
      );
    }
    return new LoginFlowError(
      bodyMessage ?? 'Signed in, but your profile could not be loaded.',
      phase,
      status
    );
  }

  return new LoginFlowError(
    phase === 'credentials'
      ? 'Invalid email or password.'
      : 'Signed in, but your profile could not be loaded.',
    phase
  );
}

function extractApiMessage(error: HttpErrorResponse): string | null {
  const body = error.error;
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  const direct =
    (typeof record.message === 'string' && record.message.trim()) ||
    (typeof record.message === 'string' && record.message.trim()) ||
    null;
  if (direct) {
    return direct;
  }
  const errors = record.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === 'string' && first.trim().length > 0) {
      return first.trim();
    }
  }
  return null;
}

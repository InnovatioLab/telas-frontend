import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { Authentication } from '@raizes-cearenses-nx/authentication-data-access';
import { Notificacao, NotificacaoState } from '../models';

@Injectable({
    providedIn: 'root'
})
export class NotificacaoResolver implements Resolve<string | null> {
    constructor(
        private notificacaoState: NotificacaoState,
        private authentication: Authentication
    ) {}

    resolve(): Observable<string | null> {
        if(!this.authentication._userSignal()) {
            return null;
        };

        return this.notificacaoState.listarNaoLidas().pipe(
            map((response: Notificacao[]) => {
                if (response && response.length > 0) {
                    return response.toString();
                } else {
                    return null;
                }
            }),
            catchError(() => {
                return of(null);
            })
        )


        
    }
}

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {} from '@angular/common/http';

@NgModule({
  imports: [],
  providers: [],
  exports: [
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class BaseModule {}

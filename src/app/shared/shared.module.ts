
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcknowledgeDialogComponent } from './components/acknowledge-dialog/acknowledge-dialog.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AcknowledgeDialogComponent
  ],
  exports: [
    AcknowledgeDialogComponent
  ]
})
export class SharedModule { }

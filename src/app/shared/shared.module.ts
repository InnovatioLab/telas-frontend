
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcknowledgeDialogComponent } from './components/acknowledge-dialog/acknowledge-dialog.component';


@NgModule({
  declarations: [
    LeafletMapsComponent
  ],
  imports: [
    CommonModule,
    AcknowledgeDialogComponent
  ],
  exports: [
    AcknowledgeDialogComponent,
    LeafletMapsComponent
  ]
})
export class SharedModule { }

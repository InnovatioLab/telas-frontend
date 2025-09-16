
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcknowledgeDialogComponent } from './components/acknowledge-dialog/acknowledge-dialog.component';
import { LeafletMapsComponent } from './components/leaflet-maps/leaflet-maps.component';

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

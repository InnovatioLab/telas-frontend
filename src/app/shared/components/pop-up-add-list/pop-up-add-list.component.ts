import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { MapPoint } from '@app/core/service/google-maps/map-point.interface';
import { GoogleMapsService } from '@app/core/service/google-maps/google-maps.service';
import { ToastService } from '@app/core/service/toast.service';

@Component({
  selector: 'app-pop-up-add-list',
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: './pop-up-add-list.component.html',
  styleUrls: ['./pop-up-add-list.component.scss']
})
export class PopUpStepAddListComponent {
  @Input() visible = false;
  @Input() position: { x: number, y: number } = { x: 0, y: 0 };
  @Input() selectedPoint: MapPoint | null = null;
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() detailsClicked = new EventEmitter<MapPoint>();
  @Output() addToListClicked = new EventEmitter<MapPoint>();

  constructor(
    private readonly googleMapsService: GoogleMapsService,
    private readonly toastService: ToastService
  ) {}

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  viewDetails(): void {
    if (this.selectedPoint) {
      this.detailsClicked.emit(this.selectedPoint);
    }
    this.close();
  }

  addToList(): void {
    if (this.selectedPoint) {
      this.toastService.sucesso('added to list');
      this.googleMapsService.addToSavedPoints(this.selectedPoint);
      this.addToListClicked.emit(this.selectedPoint);
    }
    this.close();
  }
}

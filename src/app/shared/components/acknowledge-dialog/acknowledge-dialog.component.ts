import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-acknowledge-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule],
  template: `
    <div class="acknowledge-dialog">
      <div class="alert-info">
        <p class="alert-title">{{ data.alertTitle }}</p>
        <p class="device-id">Device ID: {{ data.deviceId }}</p>
      </div>
      
      <div class="form-group">
        <label for="reason">Acknowledgement Reason:</label>
        <textarea 
          id="reason" 
          pInputTextarea 
          [(ngModel)]="reason" 
          placeholder="Please explain why you are acknowledging this alert..."
          rows="5"
          class="w-full">
        </textarea>
      </div>
      
      <div class="dialog-actions">
        <button 
          pButton 
          label="Cancel" 
          class="p-button-outlined p-button-secondary" 
          (click)="cancel()">
        </button>
        <button 
          pButton 
          label="Acknowledge" 
          class="p-button-info" 
          [disabled]="!reason.trim()"
          (click)="confirm()">
        </button>
      </div>
    </div>
  `,
  styles: [`
    .acknowledge-dialog {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .alert-info {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      border-left: 4px solid #17a2b8;
    }
    
    .alert-title {
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .device-id {
      font-size: 0.85rem;
      color: #666;
      font-family: monospace;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class AcknowledgeDialogComponent implements OnInit {
  reason: string = '';
  data: { alertTitle: string; deviceId: string };

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit() {
    this.data = this.config.data;
  }

  confirm() {
    this.ref.close(this.reason);
  }

  cancel() {
    this.ref.close();
  }
}

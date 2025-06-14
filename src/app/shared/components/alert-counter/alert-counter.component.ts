import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconWarningComponent } from '../../icons/warning.icon';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

interface AlertCountEvent {
  count: number;
  hasCritical: boolean;
}

@Component({
  selector: 'app-alert-counter',
  standalone: true,
  imports: [CommonModule, IconWarningComponent, PrimengModule],
  templateUrl: './alert-counter.component.html',
  styleUrls: ['./alert-counter.component.scss']
})
export class AlertCounterComponent implements OnInit, OnDestroy {
  @Input() isDesktop = true;
  @Input() toggleSidebar: () => void = () => {};

  adminAlertCount = signal<number>(0);
  hasAdminCriticalAlert = signal<boolean>(false);
  
  private readonly alertCountListener: (e: CustomEvent<AlertCountEvent>) => void;

  constructor(private readonly cdr: ChangeDetectorRef) {
    this.alertCountListener = (e: CustomEvent<AlertCountEvent>) => {
      if (e.detail) {
        this.adminAlertCount.set(e.detail.count);
        this.hasAdminCriticalAlert.set(e.detail.hasCritical);
        this.cdr.detectChanges();
      }
    };
  }

  ngOnInit(): void {
    const savedAlertCount = localStorage.getItem('admin_alert_count');
    if (savedAlertCount) {
      this.adminAlertCount.set(parseInt(savedAlertCount, 10));
    }
    
    const savedHasCritical = localStorage.getItem('admin_has_critical_alert');
    if (savedHasCritical) {
      this.hasAdminCriticalAlert.set(savedHasCritical === 'true');
    }
    
    window.addEventListener('admin-alert-count-changed', this.alertCountListener as EventListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('admin-alert-count-changed', this.alertCountListener as EventListener);
  }

  onToggleSidebar(): void {
    this.toggleSidebar();
    
    this.hasAdminCriticalAlert.set(false);
    localStorage.setItem('admin_has_critical_alert', 'false');
  }
}

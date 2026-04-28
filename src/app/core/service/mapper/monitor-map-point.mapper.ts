import { Injectable } from '@angular/core';
import { MonitorMapsResponseDto } from '@app/core/service/api/search-monitors.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { buildMonitorAddressLabel } from '@app/core/service/utils/monitor-address-label.util';

@Injectable({ providedIn: 'root' })
export class MonitorMapPointMapper {
  convertToMapPoints(monitors: MonitorMapsResponseDto[]): MapPoint[] {
    return monitors
      .filter(
        (monitor) =>
          monitor.latitude != null &&
          monitor.longitude != null &&
          monitor.boxActive != null
      )
      .map((monitor) => this.convertSingleMonitor(monitor));
  }

  private convertSingleMonitor(monitor: MonitorMapsResponseDto): MapPoint {
    const name = monitor.addressLocationName?.trim();
    const addressLabel = buildMonitorAddressLabel({
      addressLocationName: monitor.addressLocationName,
      addressLocationDescription: monitor.addressLocationDescription,
    });
    return {
      id: monitor.id,
      title:
        addressLabel === "Endereço indisponível" ? undefined : addressLabel,
      latitude: monitor.latitude,
      longitude: monitor.longitude,
      category: "MONITOR",
      addressLocationName: name || undefined,
      addressLocationDescription: monitor.addressLocationDescription,
      locationDescription: monitor.addressLocationDescription,
      photoUrl: monitor.photoUrl,
      hasAvailableSlots: monitor.hasAvailableSlots,
      estimatedSlotReleaseDate: monitor.estimatedSlotReleaseDate,
      data: monitor,
      healthOk: this.deriveHealthOk(monitor),
    };
  }

  private deriveHealthOk(m: MonitorMapsResponseDto): boolean {
    if (m.boxActive === false) {
      return false;
    }
    return !!m.active;
  }

}


import { Injectable } from '@angular/core';
import { MonitorMapsResponseDto } from '@app/core/service/api/search-monitors.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { buildMonitorAddressLabel } from '@app/core/service/utils/monitor-address-label.util';

@Injectable({ providedIn: 'root' })
export class MonitorMapPointMapper {
  convertToMapPoints(
    monitors: MonitorMapsResponseDto[],
    options?: { includeHealthStatus?: boolean }
  ): MapPoint[] {
    const includeHealthStatus = options?.includeHealthStatus === true;
    return monitors
      .filter(
        (monitor) =>
          monitor.latitude != null && monitor.longitude != null
      )
      .map((monitor) => this.convertSingleMonitor(monitor, includeHealthStatus));
  }

  private convertSingleMonitor(
    monitor: MonitorMapsResponseDto,
    includeHealthStatus: boolean
  ): MapPoint {
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
      healthOk: includeHealthStatus ? this.deriveHealthOk(monitor) : undefined,
    };
  }

  private deriveHealthOk(m: MonitorMapsResponseDto): boolean {
    if (m.boxActive === false || m.boxActive == null) {
      return false;
    }
    return m.active !== false;
  }

}


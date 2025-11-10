import { Injectable } from '@angular/core';
import { MonitorMapsResponseDto } from '@app/core/service/api/search-monitors.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';

@Injectable({ providedIn: 'root' })
export class MonitorMapPointMapper {
  convertToMapPoints(monitors: MonitorMapsResponseDto[]): MapPoint[] {
    return monitors
      .filter((monitor) => monitor.latitude && monitor.longitude)
      .map((monitor) => this.convertSingleMonitor(monitor));
  }

  private convertSingleMonitor(monitor: MonitorMapsResponseDto): MapPoint {
    return {
      id: monitor.id,
      title: `Monitor ${monitor.id || ''}`,
      latitude: monitor.latitude,
      longitude: monitor.longitude,
      category: 'MONITOR',
      addressLocationName: monitor.addressLocationName,
      addressLocationDescription: monitor.addressLocationDescription,
      data: monitor,
    };
  }

}


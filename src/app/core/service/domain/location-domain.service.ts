import { Injectable } from '@angular/core';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { AddressData } from '@app/model/dto/request/address-data-request';

@Injectable({ providedIn: 'root' })
export class LocationDomainService {
  createMapPointFromAddressData(addressData: AddressData): MapPoint | null {
    if (!addressData.latitude || !addressData.longitude) {
      return null;
    }

    const lat = parseFloat(addressData.latitude);
    const lng = parseFloat(addressData.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }

    return {
      latitude: lat,
      longitude: lng,
      title: `${addressData.city || ''}, ${addressData.state || ''} ${addressData.zipCode}`,
      locationDescription: `${addressData.street || ''} ${addressData.city || ''}, ${addressData.state || ''} ${addressData.zipCode}`,
      id: `zipcode-${addressData.zipCode}`,
      category: 'ADDRESS',
    };
  }

  saveLocationToLocalStorage(mapPoint: MapPoint): void {
    localStorage.setItem(
      'user_coordinates',
      JSON.stringify({
        latitude: mapPoint.latitude,
        longitude: mapPoint.longitude,
        address: mapPoint.title,
        source: 'zipcode-search',
      })
    );
  }

  emitLocationFoundEvent(mapPoint: MapPoint): void {
    const event = new CustomEvent('zipcode-location-found', {
      detail: { location: mapPoint },
    });
    window.dispatchEvent(event);
  }

  emitUserCoordinatesUpdatedEvent(mapPoint: MapPoint): void {
    const coordsEvent = new CustomEvent('user-coordinates-updated', {
      detail: {
        latitude: mapPoint.latitude,
        longitude: mapPoint.longitude,
      },
    });
    window.dispatchEvent(coordsEvent);
  }

  processLocation(addressData: AddressData, onLocationProcessed: (mapPoint: MapPoint | null) => void): void {
    if (!addressData) {
      onLocationProcessed(null);
      return;
    }

    const mapPoint = this.createMapPointFromAddressData(addressData);

    if (mapPoint) {
      this.saveLocationToLocalStorage(mapPoint);
      this.emitLocationFoundEvent(mapPoint);
      this.emitUserCoordinatesUpdatedEvent(mapPoint);
    }

    onLocationProcessed(mapPoint);
  }
}





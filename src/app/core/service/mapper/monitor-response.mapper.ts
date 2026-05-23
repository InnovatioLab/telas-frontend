import { Injectable } from "@angular/core";
import { MonitorResponseDto } from "@app/model/dto/response/monitor-response.dto";
import { Monitor } from "@app/model/monitors";

@Injectable({ providedIn: "root" })
export class MonitorResponseMapper {
  toMonitor(monitorResponse: MonitorResponseDto): Monitor {
    return {
      id: monitorResponse.id,
      active: monitorResponse.active,
      fullAddress: monitorResponse.fullAddress,
      address: monitorResponse.address ?? {
        id: "",
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
      adLinks: monitorResponse.adLinks ?? [],
      canBeDeleted: monitorResponse.canBeDeleted,
      createdAt: monitorResponse.createdAt,
      updatedAt: monitorResponse.updatedAt,
      maxAds: monitorResponse.maxAds,
      activeAdsCount: monitorResponse.activeAdsCount,
      partnerAdsCount: monitorResponse.partnerAdsCount,
      clientAdsCount: monitorResponse.clientAdsCount,
      remainingTotalSlots: monitorResponse.remainingTotalSlots,
      remainingPartnerSlots: monitorResponse.remainingPartnerSlots,
      remainingClientSlots: monitorResponse.remainingClientSlots,
      availableAdsCount: monitorResponse.availableAdsCount,
    };
  }

  toMonitors(responses: MonitorResponseDto[]): Monitor[] {
    return responses.map((response) => this.toMonitor(response));
  }
}

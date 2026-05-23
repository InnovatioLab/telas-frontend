import { MonitorResponseDto } from "@app/model/dto/response/monitor-response.dto";
import { MonitorResponseMapper } from "../monitor-response.mapper";

describe("MonitorResponseMapper", () => {
  let mapper: MonitorResponseMapper;

  beforeEach(() => {
    mapper = new MonitorResponseMapper();
  });

  it("maps full monitor response to domain model", () => {
    const dto: MonitorResponseDto = {
      id: "mon-1",
      active: true,
      fullAddress: "123 Main St",
      address: {
        id: "addr-1",
        street: "123 Main St",
        city: "Boston",
        state: "MA",
        country: "US",
        zipCode: "02101",
      },
      adLinks: [{ id: "ad-1", link: "https://x.com", fileName: "x.png" }],
      canBeDeleted: true,
      maxAds: 5,
      activeAdsCount: 2,
      partnerAdsCount: 1,
      clientAdsCount: 1,
      remainingTotalSlots: 3,
      remainingPartnerSlots: 1,
      remainingClientSlots: 2,
      availableAdsCount: 3,
    };

    const monitor = mapper.toMonitor(dto);

    expect(monitor.id).toBe("mon-1");
    expect(monitor.active).toBe(true);
    expect(monitor.fullAddress).toBe("123 Main St");
    expect(monitor.address?.zipCode).toBe("02101");
    expect(monitor.adLinks?.length).toBe(1);
    expect(monitor.maxAds).toBe(5);
    expect(monitor.remainingTotalSlots).toBe(3);
  });

  it("uses empty address defaults when address is missing", () => {
    const dto: MonitorResponseDto = {
      id: "mon-2",
      active: false,
      canBeDeleted: false,
    };

    const monitor = mapper.toMonitor(dto);

    expect(monitor.address).toEqual({
      id: "",
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    });
    expect(monitor.adLinks).toEqual([]);
  });

  it("maps list of responses", () => {
    const dtos: MonitorResponseDto[] = [
      { id: "a", active: true, canBeDeleted: true },
      { id: "b", active: false, canBeDeleted: false },
    ];

    expect(mapper.toMonitors(dtos).map((m) => m.id)).toEqual(["a", "b"]);
  });
});

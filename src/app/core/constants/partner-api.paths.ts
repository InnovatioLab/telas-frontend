export const PARTNER_PORTAL_ROUTES = {
  screens: "/partner/screens",
  screensAdRequests: "/partner/screens",
  map: "/partner/map",
  adsReview: "/partner/ads-review",
  mapUpload: (monitorId: string) => `/partner/map-upload/${monitorId}`,
  profile: "/client/profile",
  changePassword: "/client/change-password",
} as const;

export const CLIENT_PORTAL_ROUTES = {
  home: "/client",
  wishlist: "/client/wishlist",
  myTelas: "/client/my-telas",
  subscriptions: "/client/subscriptions",
  profile: "/client/profile",
  changePassword: "/client/change-password",
} as const;

export const PARTNER_API = {
  monitors: {
    myScreens: "monitors/partner/my-screens",
    placementTarget: (monitorId: string) =>
      `monitors/partner/placement-target/${monitorId}`,
    submit: (monitorId: string) =>
      `monitors/${monitorId}/partner-submissions`,
    directAd: (monitorId: string) => `monitors/${monitorId}/partner-direct-ad`,
  },
  clients: {
    workspace: "clients/me/workspace",
    attachments: "clients/attachments",
    partnerPendingAds: "clients/me/partner-pending-ads",
    partnerAdRequests: "clients/me/partner-ad-requests",
    requestAdRemoval: (adId: string) => `clients/me/partner-ads/${adId}/request-removal`,
    validateAd: (adId: string) => `clients/validate-ad/${adId}`,
  },
  addresses: {
    available: "addresses/partners/available",
  },
  cart: {
    submitPlacements: "cart/partner/submit-placements",
  },
} as const;

export const CLIENT_API = {
  authenticated: "clients/authenticated",
  workspace: "clients/me/workspace",
  attachments: "clients/attachments",
  adRequests: "clients/ads-requests",
  pendingAds: "clients/pending-ads",
} as const;

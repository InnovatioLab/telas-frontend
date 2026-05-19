export const PERMISSION_LABELS: Record<string, string> = {
  ADMIN_ADS_MANAGE: "Ads & ad requests",
  ADMIN_CLIENTS_DEACTIVATE: "Deactivate clients",
  ADMIN_CLIENTS_REACTIVATE: "Reactivate clients",
  ADMIN_CLIENTS_VIEW_INACTIVE: "View inactive clients",
  ADMIN_CLIENTS_VIEW_DELETED: "View deleted clients",
  ADMIN_CLIENTS_SOFT_DELETE: "Mark deleted (logical)",
  ADMIN_CLIENTS_PERMANENT_DELETE: "Permanent delete clients",
  MONITORING_BOX_PING_VIEW: "Box ping logs",
  MONITORING_CONNECTIVITY_PROBE_SETTINGS: "Connectivity probe interval",
  MONITORING_LOGS_VIEW: "Application logs",
  MONITORING_SCHEDULER_VIEW: "Scheduled jobs",
  MONITORING_SMART_PLUG_VIEW: "Smart plugs (view)",
  MONITORING_SMART_PLUG_ACCOUNTS_MANAGE: "Smart plug — accounts",
  MONITORING_SMART_PLUG_ASSIGN_BOX: "Smart plug — assign box",
  MONITORING_SMART_PLUG_ASSIGN_MONITOR: "Smart plug — assign screen",
  MONITORING_SMART_PLUG_DISCOVERY_RUN: "Smart plug — discovery",
  MONITORING_SMART_PLUG_HISTORY_VIEW: "Smart plug — history",
  MONITORING_SMART_PLUG_INVENTORY_CREATE: "Smart plug — add device",
  MONITORING_SMART_PLUG_INVENTORY_EDIT: "Smart plug — edit device",
  MONITORING_SMART_PLUG_INVENTORY_DELETE: "Smart plug — remove device",
  MONITORING_SMART_PLUG_LOGS_VIEW: "Smart plug — logs",
  MONITORING_SMART_PLUG_TEST_READ: "Smart plug — test read",
  MONITORING_TESTING_EXECUTE: "Run monitoring tests",
  MONITORING_TESTING_VIEW: "View monitoring tests",
  PARTNER_SLOTS_ANY_LOCATION: "5 ads on any screen",
};

export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  ADMIN_ADS_MANAGE:
    "Allows managing advertisements and client ad requests in the admin area (including flows that notify clients and other admins).",
  ADMIN_CLIENTS_DEACTIVATE:
    "Allows blocking a client account so they cannot sign in or use the platform until reactivated.",
  ADMIN_CLIENTS_REACTIVATE:
    "Allows restoring a previously deactivated client account to active use.",
  ADMIN_CLIENTS_VIEW_INACTIVE:
    "Shows deactivated clients in the clients list so you can audit or reactivate them.",
  ADMIN_CLIENTS_VIEW_DELETED:
    "Shows logically deleted clients in the list (soft-deleted records) for recovery or audit.",
  ADMIN_CLIENTS_SOFT_DELETE:
    "Allows marking a client as deleted in the system without purging all data immediately.",
  ADMIN_CLIENTS_PERMANENT_DELETE:
    "Allows irreversible removal of a client and related data where the product permits it—use only for trusted admins.",
  MONITORING_BOX_PING_VIEW:
    "Opens box connectivity / ping views and related monitoring diagnostics for digital signage boxes.",
  MONITORING_CONNECTIVITY_PROBE_SETTINGS:
    "Allows changing how often the platform probes box connectivity (intervals and related settings).",
  MONITORING_LOGS_VIEW:
    "Access to application and API log viewers for troubleshooting production issues.",
  MONITORING_SCHEDULER_VIEW:
    "View scheduled jobs and background tasks (status, timing) for operations and debugging.",
  MONITORING_SMART_PLUG_VIEW:
    "Read-only access to smart plug areas: see inventory and status without changing assignments or running actions.",
  MONITORING_SMART_PLUG_ACCOUNTS_MANAGE:
    "Create and manage credentials / accounts used to talk to smart plug vendors or cloud APIs.",
  MONITORING_SMART_PLUG_ASSIGN_BOX:
    "Link a smart plug device to a physical box so power control follows the correct hardware.",
  MONITORING_SMART_PLUG_ASSIGN_MONITOR:
    "Associate a smart plug with a screen (monitor) for location-aware power and monitoring rules.",
  MONITORING_SMART_PLUG_DISCOVERY_RUN:
    "Trigger discovery scans to find new plugs on the network or in the vendor account.",
  MONITORING_SMART_PLUG_HISTORY_VIEW:
    "Inspect historical commands and state changes for a plug (audit trail).",
  MONITORING_SMART_PLUG_INVENTORY_CREATE:
    "Register a new smart plug device into the inventory.",
  MONITORING_SMART_PLUG_INVENTORY_EDIT:
    "Update metadata or configuration of an existing smart plug record.",
  MONITORING_SMART_PLUG_INVENTORY_DELETE:
    "Remove a smart plug from inventory (does not necessarily factory-reset the hardware).",
  MONITORING_SMART_PLUG_LOGS_VIEW:
    "View detailed smart-plug integration logs (errors, polling, relay actions).",
  MONITORING_SMART_PLUG_TEST_READ:
    "Run or view read-only tests against a plug (e.g. status reads) without changing customer-facing rules.",
  MONITORING_TESTING_EXECUTE:
    "Execute monitoring test routines (e.g. probes or checks) from the admin testing UI.",
  MONITORING_TESTING_VIEW:
    "See monitoring test definitions and results without launching new test runs.",
  PARTNER_SLOTS_ANY_LOCATION:
    "Allows this partner to place up to 5 ads on any screen (monitor), at any location—not only on their registered address. Unchecked partners keep the default rule (5 ads only on their own location).",
};

export const EMAIL_ALERT_DESCRIPTIONS: Record<string, string> = {
  BOX_HEARTBEAT_CONNECTIVITY:
    "Email when a box stops sending heartbeats or appears offline—useful for catching network or hardware outages early.",
  SMART_PLUG_UNREACHABLE_OR_POWER:
    "Email when a smart plug is unreachable or reports power loss so you can act before screens stay dark.",
  SMART_PLUG_RELAY_OFF:
    "Email when a plug’s relay is turned off manually (someone cut power deliberately—may need follow-up).",
  HOST_REBOOT:
    "Email when the monitoring / application host reboots unexpectedly—helps correlate gaps in metrics or logs.",
  ADS_MANAGEMENT:
    "Email for ad workflow events (e.g. client rejected an ad, admin resent for validation)—keeps sales and ops informed.",
};

export function defaultPermissionDescription(code: string): string {
  return `Technical permission “${code}”. Grant only if this administrator should use the related feature in the admin panel.`;
}

export function defaultEmailAlertDescription(code: string): string {
  return `Alert category “${code}”. When enabled, this administrator receives an email in addition to in-app notifications.`;
}

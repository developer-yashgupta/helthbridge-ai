export type Role = "Citizen" | "ASHA Worker" | "Clinical" | "Admin";

export const roles: Role[] = ["Citizen", "ASHA Worker", "Clinical", "Admin"];

export const roleDisplayNames: Record<Role, string> = {
  Citizen: "Citizen Portal",
  "ASHA Worker": "ASHA Worker",
  Clinical: "Clinical Login",
  Admin: "Admin / Govt",
};

export const roleDescriptions: Record<Role, string> = {
    Citizen: "Access AI symptom checker, book appointments, and view your health records instantly.",
    "ASHA Worker": "Manage village health tracking, immunization schedules, and maternal care visits.",
    Clinical: "OPD management, laboratory reports, and smart referral systems for PHC/CHC.",
    Admin: "Real-time analytics, infrastructure monitoring, and system-wide audit logs.",
};

export const roleRoutes: Record<Role, string> = {
  Citizen: "/citizen/dashboard",
  "ASHA Worker": "/asha/dashboard",
  Clinical: "/clinical/dashboard",
  Admin: "/admin/dashboard",
};

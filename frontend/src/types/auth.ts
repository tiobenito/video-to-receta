// Auth types
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface DevUser extends User {
  isDev: true;
}

// Dev user for localhost bypass
export const DEV_USER: DevUser = {
  id: "dev-user-local",
  name: "Dev User",
  email: "dev@localhost",
  isDev: true,
};

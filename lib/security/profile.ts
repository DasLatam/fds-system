export type Profile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  dni: string | null;
  cuil: string | null;
  address: string | null;
  phone: string | null;
  is_paused: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export function isProfileComplete(p: Profile | null | undefined) {
  if (!p) return false;
  return Boolean(p.full_name && p.dni && p.cuil && p.address && p.phone);
}

"use server";

import { cookies } from "next/headers";

export async function logoutServer() {
  const cookieStore = await cookies();
  cookieStore.delete("token");

  return { ok: true };
}

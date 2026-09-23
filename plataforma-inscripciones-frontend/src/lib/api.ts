const USERS_API = process.env.NEXT_PUBLIC_USERS_API;
const ACADEMIC_API = process.env.NEXT_PUBLIC_ACADEMIC_API;

export { USERS_API, ACADEMIC_API };


export function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
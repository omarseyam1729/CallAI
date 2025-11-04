import { api } from "../config/api";

export async function listTriggers() {
  const res = await fetch(api("/triggers"));
  if (!res.ok) throw new Error(`List triggers failed: ${res.status}`);
  return res.json();
}
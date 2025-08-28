export const apiBase =
process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";
export async function getJSON<T = unknown>(path: string): Promise<T> {
const res = await fetch(`${apiBase}${path}`, { cache: "no-store" });
if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
return res.json() as Promise<T>;
}
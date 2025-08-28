import { useEffect, useState } from "react"; 
import { apiBase, getJSON } from "@/lib/api";

type Health = { status: string; service: string; env: string };
export default function Home() {
const [health, setHealth] = useState<Health | null>(null);
const[err, setErr] = useState<string | null>(null);

useEffect (() => {
getJSON<Health> ("/health")
.then (setHealth)
.catch((e) => setErr(String(e)));
},[]);

return (
<main style={{fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 900, margin: "0 auto" }}>
	<h1 style={{ marginBottom: 12 }}>Real-Time Data Access Platform</h1> 
	<p style={{ color: "#555" }}>
API Base: <code>{apiBase}</code>
</p>


<section style={{ marginTop: 24 }}>
<h3>Backend Health</h3>
{err && <pre style={{ color: "crimson" }}>{err}</pre>} 

{!health && !err && <p>Loading...</p>}
{health && <pre>{JSON. stringify (health, null, 2)}</pre>}
</section>
</main>
);
}

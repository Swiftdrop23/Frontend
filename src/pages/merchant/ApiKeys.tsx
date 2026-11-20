import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Button, Card, Modal } from "../../components/ui";
import Field from "../../components/Field";
import { generateCredential, listCredentials, revokeCredential } from "../../api/merchant";
import type { ApiCredential, GeneratedCredential } from "../../api/merchant";
import "./merchant.css";
import "./apiKeys.css";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

async function postJson(path: string, body: unknown, token?: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = text ? (JSON.parse(text) as Record<string, unknown>) : {}; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(String(data.message ?? data.error ?? `Request failed (${res.status})`));
  return data;
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ApiKeys() {
  const [creds, setCreds] = useState<ApiCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<GeneratedCredential | null>(null);
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [tryIt, setTryIt] = useState({ clientId: "", clientSecret: "", recipientName: "Nimal Perera", dropoffAddress: "45 Lake Road, Kandy", weightKg: "2" });
  const [tryBusy, setTryBusy] = useState(false);
  const [tryResult, setTryResult] = useState<{ ok: boolean; text: string } | null>(null);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
    }
  };

  // Member 10: try the merchant API from the browser — get a token with the key, then create an order.
  const runTry = async () => {
    setTryBusy(true);
    setTryResult(null);
    try {
      const auth = await postJson("/v1/merchant/auth/token", { clientId: tryIt.clientId.trim(), clientSecret: tryIt.clientSecret.trim() });
      const token = String(auth.accessToken ?? auth.access_token ?? auth.token ?? "");
      if (!token) throw new Error("No access token was returned.");
      const order = await postJson("/v1/merchant/orders", {
        recipientName: tryIt.recipientName.trim(), dropoffAddress: tryIt.dropoffAddress.trim(), weightKg: Number(tryIt.weightKg),
      }, token);
      const tracking = order.trackingNumber ? ` Tracking number: ${String(order.trackingNumber)}.` : "";
      setTryResult({ ok: true, text: `Order created.${tracking} It now appears in Orders and is waiting for a courier.` });
    } catch (e) {
      setTryResult({ ok: false, text: (e as Error).message });
    } finally {
      setTryBusy(false);
    }
  };

  const load = () =>
    listCredentials()
      .then(setCreds)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const created = await generateCredential();
      setNewKey(created);
      setTryIt((t) => ({ ...t, clientId: created.clientId, clientSecret: created.clientSecret }));
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    if (revokeId === null) return;
    setBusy(true);
    try {
      await revokeCredential(revokeId);
      setRevokeId(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="notice error">{error}</div>;
  if (loading) return <p className="hint">Loading credentials...</p>;

  return (
    <div className="stack">
      <Card title="Your API keys">
        {creds.length === 0 && <p className="hint">No API keys yet. Generate one to start.</p>}
        {creds.map((c) => (
          <div className="kv" key={c.id}>
            <span>{c.clientId}</span>
            <b>
              {c.active ? "Active" : "Revoked"}{" "}
              {c.active && (
                <Button variant="danger" onClick={() => setRevokeId(c.id)}>Revoke</Button>
              )}
            </b>
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          <Button loading={busy} onClick={generate}>Generate new key</Button>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          The client secret is shown only once when you generate a key. Store it safely.
        </p>
      </Card>

      <Card title="Try the API">
        <p className="hint" style={{ marginTop: 0 }}>Create a real order with your key, the same way your shop's system would.</p>
        <div className="ak-grid">
          <Field label="Client ID" value={tryIt.clientId} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, clientId: e.target.value })} />
          <Field label="Client secret" type="password" value={tryIt.clientSecret} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, clientSecret: e.target.value })} />
          <Field label="Recipient name" value={tryIt.recipientName} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, recipientName: e.target.value })} />
          <Field label="Drop-off address" value={tryIt.dropoffAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, dropoffAddress: e.target.value })} />
          <Field label="Weight (kg)" inputMode="decimal" value={tryIt.weightKg} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, weightKg: e.target.value })} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Button loading={tryBusy} disabled={!tryIt.clientId || !tryIt.clientSecret} onClick={() => void runTry()}>Create test order</Button>
        </div>
        {tryResult && <p className={`notice ${tryResult.ok ? "ok" : "error"}`} role="status" style={{ marginTop: 12 }}>{tryResult.text}</p>}
      </Card>

      <Card title="API documentation">
        <h4>1. Get an access token</h4>
        <p className="hint" style={{ margin: 0 }}>POST /api/v1/merchant/auth/token</p>
        <pre className="code">{`Content-Type: application/json

{ "clientId": "your_client_id",
  "clientSecret": "your_client_secret" }`}</pre>
        <h4>2. Create an order</h4>
        <p className="hint" style={{ margin: 0 }}>POST /api/v1/merchant/orders</p>
        <pre className="code">{`Authorization: Bearer your_access_token
Content-Type: application/json

{ "recipientName": "Nimal P.",
  "dropoffAddress": "Kandy",
  "weightKg": 2 }`}</pre>
        <h4>Webhook events</h4>
        <p className="hint">parcel.status.changed is sent to your webhook URL whenever a parcel status changes.</p>
      </Card>

      <Modal
        open={newKey !== null}
        title="Your new API key"
        onClose={() => setNewKey(null)}
        footer={<Button onClick={() => setNewKey(null)}>I have saved it</Button>}
      >
        {newKey && (
          <>
            <Field label="Client ID" value={newKey.clientId} readOnly />
            <Field label="Client secret" value={newKey.clientSecret} readOnly />
            <div className="ak-actions">
              <Button onClick={() => void copy("id", newKey.clientId)}>{copied === "id" ? "Copied ✓" : "Copy client ID"}</Button>
              <Button onClick={() => void copy("secret", newKey.clientSecret)}>{copied === "secret" ? "Copied ✓" : "Copy secret"}</Button>
              <Button onClick={() => download(`swiftdrop-api-key-${newKey.clientId}.txt`,
                `SwiftDrop merchant API key\nClient ID: ${newKey.clientId}\nClient secret: ${newKey.clientSecret}\n\nKeep this file private.\n`)}>Download .txt</Button>
            </div>
            <p className="ak-warning">Save the secret now. For security it is stored only as a hash, so it can never be shown again.
              It is also filled into “Try the API” below until you leave this page.</p>
          </>
        )}
      </Modal>

      <Modal
        open={revokeId !== null}
        title="Revoke API key?"
        onClose={() => setRevokeId(null)}
        footer={
          <>
            <Button onClick={() => setRevokeId(null)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={revoke}>Revoke</Button>
          </>
        }
      >
        {/* Modal body */}
        <p>This key will stop working immediately.</p>
      </Modal>
    </div>
  );
}

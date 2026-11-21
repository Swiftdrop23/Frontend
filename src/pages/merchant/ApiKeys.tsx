import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [showRevoked, setShowRevoked] = useState(false);
  const [tryIt, setTryIt] = useState({ clientId: "", clientSecret: "", recipientName: "", dropoffAddress: "", weightKg: "2" });
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

  const active = creds.filter((c) => c.active);
  const revoked = creds.filter((c) => !c.active);
  const shown = showRevoked ? creds : active;
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="stack ak-page">
      <section className="ak-hero">
        <h2>Connect your online shop</h2>
        <p>If you sell online, your shop's system can book SwiftDrop deliveries by itself — no need to enter each parcel here.
          It takes three steps:</p>
        <ol className="ak-steps">
          <li><b>Create a key</b><span>Your shop uses it to sign in to SwiftDrop, like a username and password.</span></li>
          <li><b>Send orders</b><span>Each new shop order becomes a SwiftDrop delivery and appears in Orders.</span></li>
          <li><b>Get delivery updates</b><span>We tell your shop when a parcel is picked up or delivered.</span></li>
        </ol>
      </section>

      <Card title="Step 1 · Your keys">
        <p className="hint" style={{ marginTop: 0 }}>Keep one active key. If a key is leaked, revoke it and create a new one.</p>
        {shown.length === 0 && <p className="ak-empty">No active key yet. Create one to connect your shop.</p>}
        {shown.map((c) => (
          <div className="ak-key" key={c.id}>
            <div>
              <code>{c.clientId}</code>
              {c.createdAt && <span className="ak-muted">Created {formatDate(c.createdAt)}</span>}
            </div>
            <div className="ak-key-actions">
              <span className={`ak-pill ${c.active ? "on" : "off"}`}>{c.active ? "Active" : "Revoked"}</span>
              {c.active && <Button variant="danger" onClick={() => setRevokeId(c.id)}>Revoke</Button>}
            </div>
          </div>
        ))}
        <div className="ak-row">
          <Button loading={busy} onClick={generate}>Create new key</Button>
          {revoked.length > 0 && (
            <button type="button" className="ak-link" onClick={() => setShowRevoked(!showRevoked)}>
              {showRevoked ? "Hide revoked keys" : `Show revoked keys (${revoked.length})`}
            </button>
          )}
        </div>
      </Card>

      <Card title="Step 2 · Send a test order">
        <p className="hint" style={{ marginTop: 0 }}>See it work before connecting your shop. This creates a real order that a
          dispatcher can assign to a courier. A key you just created is filled in for you; otherwise paste the Client ID and
          secret you saved.</p>
        <div className="ak-grid">
          <Field label="Client ID" value={tryIt.clientId} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, clientId: e.target.value })} />
          <Field label="Client secret" type="password" value={tryIt.clientSecret} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, clientSecret: e.target.value })} />
          <Field label="Recipient name" placeholder="Kamal Silva" value={tryIt.recipientName} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, recipientName: e.target.value })} />
          <Field label="Drop-off address" placeholder="12 Temple Road, Kandy" value={tryIt.dropoffAddress} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, dropoffAddress: e.target.value })} />
          <Field label="Weight (kg)" inputMode="decimal" value={tryIt.weightKg} onChange={(e: ChangeEvent<HTMLInputElement>) => setTryIt({ ...tryIt, weightKg: e.target.value })} />
        </div>
        <div className="ak-row">
          <Button variant="primary" loading={tryBusy} disabled={!tryIt.clientId || !tryIt.clientSecret || !tryIt.recipientName.trim() || !tryIt.dropoffAddress.trim()} onClick={() => void runTry()}>Send test order</Button>
          {tryResult?.ok && <Link className="ak-link" to="/merchant/orders">Open Orders →</Link>}
          <a className="ak-link" href="/demo-shop" target="_blank" rel="noreferrer">Or try it as a shopper in the Demo Mart shop ↗</a>
        </div>
        {tryResult && <p className={`notice ${tryResult.ok ? "ok" : "error"}`} role="status" style={{ marginTop: 12 }}>{tryResult.text}</p>}
      </Card>

      <Card title="Step 3 · Delivery updates">
        <p className="hint" style={{ marginTop: 0 }}>Add your shop's web address on the Webhooks page. Every time a parcel's status
          changes, SwiftDrop sends the new status there, so your customers see it in your shop too.</p>
        <Link className="ak-btn" to="/merchant/webhooks">Set up delivery updates →</Link>
      </Card>

      <details className="ak-dev">
        <summary>For developers: API reference</summary>
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
      </details>

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

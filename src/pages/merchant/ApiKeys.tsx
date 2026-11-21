import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Modal } from "../../components/ui";
import Field from "../../components/Field";
import { generateCredential, listCredentials, revokeCredential } from "../../api/merchant";
import type { ApiCredential, GeneratedCredential } from "../../api/merchant";
import "./merchant.css";
import "./apiKeys.css";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function developerNotes(clientId: string, clientSecret: string) {
  const base = `${window.location.origin}${API_BASE}`;
  return `SwiftDrop shop connection - for your web developer
KEEP THIS FILE PRIVATE. It contains a secret.

Client ID:     ${clientId}
Client secret: ${clientSecret}
(The secret cannot be shown again. If it is lost, disable this connection and create a new one.)

1. Get an access token
   POST ${base}/v1/merchant/auth/token
   Content-Type: application/json

   { "clientId": "${clientId}", "clientSecret": "<client secret>" }

2. Create a delivery order for each new shop order
   POST ${base}/v1/merchant/orders
   Authorization: Bearer <access token>
   Content-Type: application/json

   { "recipientName": "Nimal P.", "dropoffAddress": "Kandy", "weightKg": 2 }

3. Receive delivery updates
   Add your shop's webhook URL on the "Delivery updates" page in the SwiftDrop merchant portal.
   SwiftDrop sends a "parcel.status.changed" event to that URL whenever a parcel status changes.
`;
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

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
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
  if (loading) return <p className="hint">Loading your connections...</p>;

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
        <p>If you sell online, your shop can book SwiftDrop deliveries on its own, so you don't have to type in each parcel.
          Your web developer can set this up. No online shop? You can add parcels by hand in{" "}
          <Link to="/merchant/orders" style={{ color: "inherit", textDecoration: "underline" }}>Orders</Link>.</p>
        <ol className="ak-steps">
          <li><b>Create a connection</b><span>This gives your shop a username and password to sign in to SwiftDrop.</span></li>
          <li><b>Give it to your developer</b><span>They connect your shop. Each new shop order then becomes a SwiftDrop delivery and shows up in Orders.</span></li>
        </ol>
      </section>

      <Card title="Your connections">
        <p className="hint" style={{ marginTop: 0 }}>Keep one active connection. If someone you don't trust sees it, disable it and create a new one.</p>
        {shown.length === 0 && <p className="ak-empty">You have no active connection yet. Create one to link your shop.</p>}
        {shown.map((c) => (
          <div className="ak-key" key={c.id}>
            <div>
              <code>{c.clientId}</code>
              {c.createdAt && <span className="ak-muted">Created {formatDate(c.createdAt)}</span>}
            </div>
            <div className="ak-key-actions">
              <span className={`ak-pill ${c.active ? "on" : "off"}`}>{c.active ? "Active" : "Disabled"}</span>
              {c.active && <Button variant="danger" onClick={() => setRevokeId(c.id)}>Disable</Button>}
            </div>
          </div>
        ))}
        <div className="ak-row">
          <Button loading={busy} onClick={generate}>Create new connection</Button>
          <a className="ak-link" href="/demo-shop" target="_blank" rel="noreferrer">See an example shop (Demo Mart)</a>
          {revoked.length > 0 && (
            <button type="button" className="ak-link" onClick={() => setShowRevoked(!showRevoked)}>
              {showRevoked ? "Hide disabled connections" : `Show disabled connections (${revoked.length})`}
            </button>
          )}
        </div>
      </Card>

      <Modal
        open={newKey !== null}
        title="Give this to your web developer"
        onClose={() => setNewKey(null)}
        footer={<Button onClick={() => setNewKey(null)}>I have saved it</Button>}
      >
        {newKey && (
          <>
            <p>Your developer needs these details to connect your shop to SwiftDrop. You don't need to enter them anywhere yourself.</p>
            <div className="ak-actions">
              <Button variant="primary" onClick={() => download(`swiftdrop-shop-connection-${newKey.clientId}.txt`, developerNotes(newKey.clientId, newKey.clientSecret))}>Download file for my developer</Button>
            </div>
            <details className="ak-dev" style={{ marginTop: 12 }}>
              <summary>Show the details</summary>
              <Field label="Client ID" value={newKey.clientId} readOnly />
              <Field label="Client secret" value={newKey.clientSecret} readOnly />
              <div className="ak-actions">
                <Button onClick={() => void copy("id", newKey.clientId)}>{copied === "id" ? "Copied" : "Copy client ID"}</Button>
                <Button onClick={() => void copy("secret", newKey.clientSecret)}>{copied === "secret" ? "Copied" : "Copy client secret"}</Button>
              </div>
            </details>
            <p className="ak-warning">Download the file before you close this window. For your safety we can't show the secret again.</p>
          </>
        )}
      </Modal>

      <Modal
        open={revokeId !== null}
        title="Disable this connection?"
        onClose={() => setRevokeId(null)}
        footer={
          <>
            <Button onClick={() => setRevokeId(null)}>Keep it</Button>
            <Button variant="danger" loading={busy} onClick={revoke}>Disable connection</Button>
          </>
        }
      >
        <p>Your shop will stop sending parcels to SwiftDrop with this connection straight away. You can create a new one at any time.</p>
      </Modal>
    </div>
  );
}

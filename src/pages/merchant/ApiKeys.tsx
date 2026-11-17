import { useEffect, useState } from "react";
import { Button, Card, Modal } from "../../components/ui";
import Field from "../../components/Field";
import { generateCredential, listCredentials, revokeCredential } from "../../api/merchant";
import type { ApiCredential, GeneratedCredential } from "../../api/merchant";
import "./merchant.css";

export default function ApiKeys() {
  const [creds, setCreds] = useState<ApiCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<GeneratedCredential | null>(null);
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      setNewKey(await generateCredential());
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
        footer={<Button onClick={() => setNewKey(null)}>Done</Button>}
      >
        {newKey && (
          <>
            <Field label="Client ID" value={newKey.clientId} readOnly />
            <Field label="Client secret" value={newKey.clientSecret} readOnly />
            <p className="hint">Copy the secret now. It will not be shown again.</p>
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
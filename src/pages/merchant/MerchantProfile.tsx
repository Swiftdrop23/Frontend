import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { getMerchantProfile, updateMerchantProfile } from "../../api/merchantProfile";
import type { MerchantProfile as Profile } from "../../api/merchantProfile";
import "./merchantProfile.css";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function errorText(err: unknown): string {
  const body = err as { fieldErrors?: Record<string, string>; message?: string };
  const fields = body?.fieldErrors ? Object.values(body.fieldErrors) : [];
  if (fields.length) return fields.join(" ");
  return err instanceof Error ? err.message : body?.message ?? "Something went wrong. Please try again.";
}

/** Member 10: Merchant business profile — details from the approved application, with editable contact info. */
export default function MerchantProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ contactName: "", phone: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMerchantProfile()
      .then((p) => {
        setProfile(p);
        setForm({ contactName: p.contactName, phone: p.phone, address: p.address });
      })
      .catch((e) => setError(errorText(e)));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateMerchantProfile(form);
      setProfile(updated);
      setForm({ contactName: updated.contactName, phone: updated.phone, address: updated.address });
      setNotice("Business profile saved.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return <section className="mp-card">{error
      ? <p className="notice error" role="alert">{error}</p>
      : <p role="status">Loading business profile…</p>}</section>;
  }

  return (
    <div className="mp-grid">
      <section className="mp-card" aria-labelledby="mp-business">
        <div className="mp-head">
          <h2 id="mp-business">{profile.businessName}</h2>
          <span className={`mp-badge ${profile.status.toLowerCase()}`}>{profile.status.charAt(0) + profile.status.slice(1).toLowerCase()}</span>
        </div>
        <dl className="mp-list">
          <div><dt>Registration number</dt><dd>{profile.registrationNo}</dd></div>
          <div><dt>Business email</dt><dd>{profile.email}</dd></div>
          <div><dt>Applied on</dt><dd>{formatDate(profile.submittedAt)}</dd></div>
          <div><dt>Approved on</dt><dd>{formatDate(profile.reviewedAt)}</dd></div>
        </dl>
        <p className="mp-hint">The business name, registration number and email are fixed after approval. Contact SwiftDrop support to change them.</p>
      </section>

      <form className="mp-card" onSubmit={save} aria-labelledby="mp-contact" noValidate>
        <h2 id="mp-contact">Contact details</h2>
        {error && <p className="notice error" role="alert">{error}</p>}
        {notice && <p className="notice ok" role="status">{notice}</p>}
        <label className="mp-field">Contact person
          <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} autoComplete="name" required />
        </label>
        <label className="mp-field">Business phone
          <input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel-national" required />
        </label>
        <label className="mp-field">Business address
          <textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} autoComplete="street-address" required />
        </label>
        <div className="mp-actions">
          <button type="submit" className="mp-btn primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          <Link className="mp-btn" to="change-password">Change password</Link>
        </div>
      </form>
    </div>
  );
}

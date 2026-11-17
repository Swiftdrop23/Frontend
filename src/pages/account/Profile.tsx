import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Field from "../../components/Field";
import type { FieldChange } from "../../components/Field";
import { getAdminProfile } from "../../api/adminAccount";
import { getProfile, updateProfile, listAddresses, saveAddress, deleteAddress } from "../../api/users";
import { isPhone } from "../../utils/validate";
import { errMessage } from "../../utils/errors";
import type { Address, Notice, Profile as ProfileData, Role } from "../../types";
import "../../profile.css";

function AdminProfilePanel() {
  const [profile, setProfile] = useState<{ fullName: string; email: string; role: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminProfile().then(setProfile)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not load admin account."));
  }, []);

  return (
    <section className="card narrow">
      <h3>Admin account</h3>
      {error && <p className="notice error" role="alert">{error}</p>}
      {!profile && !error && <p className="hint" role="status">Loading account details…</p>}
      {profile && <dl className="profile-details">
        <dt>Name</dt><dd>{profile.fullName}</dd>
        <dt>Email</dt><dd>{profile.email}</dd>
        <dt>Role</dt><dd>{profile.role}</dd>
      </dl>}
    </section>
  );
}

function PersonalDetails() {
  const [f, setF] = useState<ProfileData>({ fullName: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<"fullName" | "phone", string>>>({});
  const [msg, setMsg] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (e: FieldChange) => setF({ ...f, [e.target.name]: e.target.value });

  useEffect(() => {
    getProfile()
      .then((p) => setF({ fullName: p.fullName || "", email: p.email || "", phone: p.phone || "" }))
      .catch((e) => setMsg({ type: "error", text: errMessage(e) }));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    const er: Partial<Record<"fullName" | "phone", string>> = {};
    if (!f.fullName.trim()) er.fullName = "Full name is required.";
    if (!isPhone(f.phone)) er.phone = "Enter a 10-digit number like 0771234567.";
    setErrors(er);
    setMsg(null);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await updateProfile({ fullName: f.fullName.trim(), phone: f.phone.trim() });
      setMsg({ type: "ok", text: "Your details were saved." });
    } catch (err) {
      setMsg({ type: "error", text: errMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h3>Personal details</h3>
      {msg && <div className={`notice ${msg.type}`} role="alert">{msg.text}</div>}
      <form onSubmit={save} noValidate>
        <Field label="Full name" name="fullName" value={f.fullName} onChange={set} error={errors.fullName} />
        <Field label="Email" name="email" type="email" value={f.email} readOnly title="Email cannot be changed here" />
        <Field label="Phone" name="phone" type="tel" placeholder="07X XXX XXXX" value={f.phone} onChange={set} error={errors.phone} />
        <div className="row">
          <button className="btn primary inline" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
          <Link className="btn inline" to="change-password">Change password</Link>
        </div>
      </form>
    </section>
  );
}

function SavedAddresses() {
  const [list, setList] = useState<Address[]>([]);
  const [form, setForm] = useState<Address | null>(null); // null = hidden; {id?, label, address}
  const [errors, setErrors] = useState<Partial<Record<"label" | "address", string>>>({});
  const [msg, setMsg] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => listAddresses().then(setList).catch((e) => setMsg({ type: "error", text: errMessage(e) }));
  useEffect(() => { load(); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const er: Partial<Record<"label" | "address", string>> = {};
    if (!form.label.trim()) er.label = "Give this address a name, e.g. Home.";
    if (form.address.trim().length < 5) er.address = "Enter the full address.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await saveAddress({ ...form, label: form.label.trim(), address: form.address.trim() });
      setForm(null);
      setMsg(null);
      await load();
    } catch (err) {
      setMsg({ type: "error", text: errMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Address) {
    if (a.id === undefined) return;
    if (!window.confirm(`Delete the "${a.label}" address?`)) return;
    try {
      await deleteAddress(a.id);
      await load();
    } catch (err) {
      setMsg({ type: "error", text: errMessage(err) });
    }
  }

  return (
    <section className="card">
      <h3>Saved addresses</h3>
      {msg && <div className={`notice ${msg.type}`} role="alert">{msg.text}</div>}
      <div className="addr-list">
        {list.length === 0 && <p className="hint" style={{ margin: 0 }}>No saved addresses yet.</p>}
        {list.map((a) => (
          <div className="addr" key={a.id}>
            <div><strong>{a.label}</strong><span>{a.address}</span></div>
            <div className="row">
              <button type="button" className="btn inline" onClick={() => { setErrors({}); setForm({ ...a }); }}>Edit</button>
              <button type="button" className="btn inline danger" onClick={() => remove(a)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {form ? (
        <form className="addr-form" onSubmit={save} noValidate>
          <Field label="Name" placeholder="Home, Work..." value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} error={errors.label} />
          <Field label="Address" placeholder="Street, city" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address} />
          <div className="row">
            <button className="btn primary inline" disabled={busy}>{busy ? "Saving..." : "Save address"}</button>
            <button type="button" className="btn inline" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn" onClick={() => { setErrors({}); setForm({ label: "", address: "" }); }}>Add address</button>
      )}
    </section>
  );
}

// Saved addresses are for customers only. Merchants use the Business Profile page (Member 4).
export default function Profile({ role }: { role: Role }) {
  if (role === "ADMIN") return <AdminProfilePanel />;

  return (
    <div className={`profile-grid ${role === "CUSTOMER" ? "profile-wide grid-2" : "profile-single"}`}>
      <PersonalDetails />
      {role === "CUSTOMER" && <SavedAddresses />}
    </div>
  );
}

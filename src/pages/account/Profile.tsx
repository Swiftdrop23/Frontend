import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Field from "../../components/Field";
import type { FieldChange } from "../../components/Field";
import { getAdminProfile } from "../../api/adminAccount";
import { liveMapApi, VEHICLE_TYPES } from "../../api/liveMap";
import type { CourierProfile } from "../../api/liveMap";
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
      <div className="row">
        <Link className="btn inline" to="change-password">Change password</Link>
      </div>
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

/** Member 10: the courier's vehicle (shown to customers while the courier is on the way to a pickup). */
function CourierVehicle() {
  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [form, setForm] = useState({ phone: "", vehicleType: "", vehicleNumber: "" });
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    liveMapApi.profile().then((p) => {
      setProfile(p);
      setForm({ phone: p.phone ?? "", vehicleType: p.vehicleType ?? "", vehicleNumber: p.vehicleNumber ?? "" });
      if (!p.vehicleType || !p.vehicleNumber) setEditing(true);
    }).catch((e) => setMsg({ type: "error", text: errMessage(e) }));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.vehicleType || !form.vehicleNumber.trim()) {
      setMsg({ type: "error", text: "Choose the vehicle type and enter the vehicle number." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const saved = await liveMapApi.saveProfile({ ...form, vehicleNumber: form.vehicleNumber.trim().toUpperCase(), phone: form.phone.trim() });
      setProfile(saved);
      setEditing(false);
      setMsg({ type: "ok", text: "Vehicle saved. Customers see these details when you are on the way." });
    } catch (err) {
      setMsg({ type: "error", text: errMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h3>My vehicle</h3>
      {msg && <div className={`notice ${msg.type}`} role="alert">{msg.text}</div>}
      {!editing && profile && (
        <>
          <div className="vehicle-summary">
            <span className="vehicle-plate">{profile.vehicleNumber ?? "No number"}</span>
            <span className="vehicle-type">{profile.vehicleType ?? "Vehicle not added"}</span>
          </div>
          <dl className="profile-details">
            <dt>Vehicle type</dt><dd>{profile.vehicleType ?? "Not added"}</dd>
            <dt>Vehicle number</dt><dd>{profile.vehicleNumber ?? "Not added"}</dd>
            <dt>Contact phone</dt><dd>{profile.phone ?? "Not added"}</dd>
          </dl>
          <p className="hint">Customers see your name, vehicle and phone while you are on the way to pick up their parcel.</p>
          <div className="row">
            <button type="button" className="btn inline" onClick={() => setEditing(true)}>Edit vehicle</button>
          </div>
        </>
      )}
      {editing && (
        <form onSubmit={save} noValidate>
          <Field select label="Vehicle type" name="vehicleType" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
            <option value="">Choose…</option>
            {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </Field>
          <Field label="Vehicle number" name="vehicleNumber" placeholder="BAB-1234" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
          <Field label="Contact phone" name="phone" type="tel" placeholder="0771234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="row">
            <button className="btn primary inline" disabled={busy}>{busy ? "Saving..." : "Save vehicle"}</button>
            {profile?.vehicleType && <button type="button" className="btn inline" onClick={() => setEditing(false)}>Cancel</button>}
          </div>
        </form>
      )}
      {!editing && !profile && !msg && <p className="hint" role="status">Loading vehicle…</p>}
    </section>
  );
}

// Saved addresses are for customers only. Merchants use the Business Profile page (Member 4).
export default function Profile({ role }: { role: Role }) {
  if (role === "ADMIN") return <AdminProfilePanel />;

  return (
    <div className={`profile-grid ${role === "CUSTOMER" || role === "COURIER" ? "profile-wide grid-2" : "profile-single"}`}>
      <PersonalDetails />
      {role === "CUSTOMER" && <SavedAddresses />}
      {role === "COURIER" && <CourierVehicle />}
    </div>
  );
}

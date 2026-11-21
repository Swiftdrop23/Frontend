import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Field from "../../components/Field";
import type { FieldChange } from "../../components/Field";
import { changeRole, createUser, listUsers, setUserEnabled, STAFF_ROLES } from "../../api/adminUsers";
import type { ManagedRole, ManagedUser, NewUser } from "../../api/adminUsers";
import { getUser } from "../../api/auth";
import { isEmail, isPhone, isStrong } from "../../utils/validate";
import { errMessage } from "../../utils/errors";
import type { Notice } from "../../types";
import "./admin.css";

const EMPTY: NewUser = { fullName: "", email: "", phone: "", password: "", role: "COURIER" };
const ROLE_LABEL: Record<ManagedRole, string> = {
  CUSTOMER: "Customer", MERCHANT: "Merchant", COURIER: "Courier", DISPATCHER: "Dispatcher", ADMIN: "Admin",
};

/** Member 1: admin user management (list, add staff, disable/enable, change role). */
export default function Users() {
  const me = getUser() as unknown as { email?: string } | null;
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [role, setRole] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState("");
  const [form, setForm] = useState<NewUser | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof NewUser, string>>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (nextRole: string, nextQuery: string) => {
    setLoading(true);
    try {
      setUsers(await listUsers(nextRole, nextQuery));
    } catch (err) {
      setMsg({ type: "error", text: errMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load("", ""); }, [load]);

  function search(e: FormEvent) {
    e.preventDefault();
    void load(role, query);
  }

  async function updateRole(user: ManagedUser, next: ManagedRole) {
    if (next === user.role) return;
    setBusyId(user.id);
    setMsg(null);
    try {
      const updated = await changeRole(user.id, next);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      setMsg({ type: "ok", text: `${updated.fullName} is now ${ROLE_LABEL[updated.role]}.` });
    } catch (err) {
      setMsg({ type: "error", text: errMessage(err) });
    } finally {
      setBusyId("");
    }
  }

  async function toggle(user: ManagedUser) {
    if (user.enabled && !window.confirm(`Disable ${user.fullName}? They will be signed out and cannot log in.`)) return;
    setBusyId(user.id);
    setMsg(null);
    try {
      const updated = await setUserEnabled(user.id, !user.enabled);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      setMsg({ type: "ok", text: `${updated.fullName} was ${updated.enabled ? "enabled" : "disabled"}.` });
    } catch (err) {
      setMsg({ type: "error", text: errMessage(err) });
    } finally {
      setBusyId("");
    }
  }

  async function addUser(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    const er: Partial<Record<keyof NewUser, string>> = {};
    if (!form.fullName.trim()) er.fullName = "Full name is required.";
    if (!isEmail(form.email)) er.email = "Enter a valid email address.";
    if (form.phone.trim() && !isPhone(form.phone)) er.phone = "Enter a 10-digit number like 0771234567.";
    if (!isStrong(form.password)) er.password = "Use at least 8 characters with letters and numbers.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const created = await createUser({ ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() });
      setUsers((list) => [created, ...list]);
      setForm(null);
      setMsg({ type: "ok", text: `${created.fullName} was added as ${ROLE_LABEL[created.role]}.` });
    } catch (err) {
      setMsg({ type: "error", text: errMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  const setField = (e: FieldChange) => form && setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="admin-users">
      {msg && <div className={`notice ${msg.type}`} role="alert">{msg.text}</div>}

      <section className="card">
        <form className="row" onSubmit={search} style={{ alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <Field select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            {(Object.keys(ROLE_LABEL) as ManagedRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Field>
          <Field label="Search" placeholder="Name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn primary inline">Search</button>
          {!form && (
            <button type="button" className="btn inline" onClick={() => { setErrors({}); setForm({ ...EMPTY }); }}>
              Add staff account
            </button>
          )}
        </form>
      </section>

      {form && (
        <section className="card">
          <h3>Add staff account</h3>
          <form onSubmit={addUser} noValidate>
            <Field label="Full name" name="fullName" value={form.fullName} onChange={setField} error={errors.fullName} />
            <Field label="Email" name="email" type="email" value={form.email} onChange={setField} error={errors.email} />
            <Field label="Phone (optional)" name="phone" type="tel" placeholder="07X XXX XXXX" value={form.phone} onChange={setField} error={errors.phone} />
            <Field label="Temporary password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={setField} error={errors.password} />
            <Field select label="Role" name="role" value={form.role} onChange={setField}>
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </Field>
            <div className="row">
              <button className="btn primary inline" disabled={saving}>{saving ? "Saving..." : "Create account"}</button>
              <button type="button" className="btn inline" onClick={() => setForm(null)}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      <section className="card">
        {loading && <p className="hint" role="status">Loading users...</p>}
        {!loading && users.length === 0 && <p className="hint">No users match this search.</p>}
        {!loading && users.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const self = me?.email?.toLowerCase() === u.email.toLowerCase();
                  return (
                    <tr key={u.id}>
                      <td>{u.fullName}{self && " (you)"}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || "-"}</td>
                      <td>
                        {u.role === "MERCHANT" ? ROLE_LABEL.MERCHANT : (
                          <select className="admin-role-select" aria-label={`Role of ${u.fullName}`} value={u.role} disabled={busyId === u.id || self}
                            onChange={(e) => void updateRole(u, e.target.value as ManagedRole)}>
                            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </select>
                        )}
                      </td>
                      <td><span className={u.enabled ? "admin-state on" : "admin-state"}>{u.enabled ? "Active" : u.status.charAt(0) + u.status.slice(1).toLowerCase()}</span></td>
                      <td>
                        {u.role === "MERCHANT" ? (
                          <a className="btn inline" href="/admin/merchant-approvals">Manage</a>
                        ) : (
                          <button type="button" className={`btn inline${u.enabled ? " danger" : ""}`} disabled={busyId === u.id || self}
                            onClick={() => void toggle(u)}>
                            {u.enabled ? "Disable" : "Enable"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

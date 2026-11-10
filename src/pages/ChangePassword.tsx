import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Field from "../components/Field";
import type { FieldChange } from "../components/Field";
import { changePassword } from "../api/users";
import { isStrong } from "../utils/validate";
import { errMessage } from "../utils/errors";
import type { Notice } from "../types";
import "../profile.css";

interface Fields {
  current: string;
  password: string;
  confirm: string;
}

const EMPTY: Fields = { current: "", password: "", confirm: "" };

export default function ChangePassword() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [msg, setMsg] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (e: FieldChange) => setF({ ...f, [e.target.name]: e.target.value });

  async function save(e: FormEvent) {
    e.preventDefault();
    const er: Partial<Fields> = {};
    if (!f.current) er.current = "Enter your current password.";
    if (!isStrong(f.password)) er.password = "Use at least 8 characters with letters and numbers.";
    else if (f.password === f.current) er.password = "Choose a password different from the current one.";
    if (f.confirm !== f.password) er.confirm = "Passwords do not match.";
    setErrors(er);
    setMsg(null);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await changePassword(f.current, f.password);
      setF(EMPTY);
      setMsg({ type: "ok", text: "Your password was updated." });
    } catch (err) {
      setMsg({ type: "error", text: errMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card narrow">
      <h3>Change password</h3>
      {msg && <div className={`notice ${msg.type}`} role="alert">{msg.text}</div>}
      <form onSubmit={save} noValidate>
        <Field label="Current password" name="current" type="password" placeholder="Enter current password" autoComplete="current-password" value={f.current} onChange={set} error={errors.current} />
        <Field label="New password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" value={f.password} onChange={set} error={errors.password} />
        <Field label="Confirm new password" name="confirm" type="password" placeholder="Re-enter new password" autoComplete="new-password" value={f.confirm} onChange={set} error={errors.confirm} />
        <p className="hint">Use at least 8 characters with letters and numbers.</p>
        <div className="row">
          <button className="btn primary inline" disabled={busy}>{busy ? "Saving..." : "Save password"}</button>
          <Link className="btn inline" to=".." relative="path">Cancel</Link>
        </div>
      </form>
    </section>
  );
}

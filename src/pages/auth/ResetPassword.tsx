import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import Field from "../../components/Field";
import type { FieldChange } from "../../components/Field";
import { resetPassword } from "../../api/auth";
import { isStrong } from "../../utils/validate";
import { errMessage } from "../../utils/errors";

interface Fields {
  password: string;
  confirm: string;
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();
  const [f, setF] = useState<Fields>({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (e: FieldChange) => setF({ ...f, [e.target.name]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: Partial<Fields> = {};
    if (!isStrong(f.password)) er.password = "Use at least 8 characters with letters and numbers.";
    if (f.confirm !== f.password) er.confirm = "Passwords do not match.";
    setErrors(er);
    setMsg("");
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await resetPassword(token, f.password);
      nav("/login");
    } catch (err) {
      setMsg(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Set a new password">
      {msg && <div className="notice error" role="alert">{msg}</div>}
      <form onSubmit={submit} noValidate>
        <Field label="New password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" value={f.password} onChange={set} error={errors.password} />
        <Field label="Confirm new password" name="confirm" type="password" placeholder="Re-enter password" autoComplete="new-password" value={f.confirm} onChange={set} error={errors.confirm} />
        <button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Reset password"}</button>
      </form>
      <div className="links">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  );
}

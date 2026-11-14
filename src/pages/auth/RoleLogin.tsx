import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import Field from "../../components/Field";
import type { FieldChange } from "../../components/Field";
import { login, saveSession } from "../../api/auth";
import { homePath } from "../../config/navigation";
import { findLoginRole } from "../../config/roles";
import { isEmail } from "../../utils/validate";
import { errMessage } from "../../utils/errors";
import type { Role } from "../../types";
import "./auth-roles.css";

interface Fields {
  email: string;
  password: string;
}

// One sign-in form for every role.
//   /login/:roleSlug  -> customer | merchant | courier | dispatcher (chosen on the main login page)
//   /admin-login      -> <RoleLogin admin />, not linked from anywhere
export default function RoleLogin({ admin = false }: { admin?: boolean }) {
  const { roleSlug } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [f, setF] = useState<Fields>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [msg, setMsg] = useState(params.get("error") === "google" ? "Google sign-in failed. Please try again." : "");
  const [busy, setBusy] = useState(false);
  const set = (e: FieldChange) => setF({ ...f, [e.target.name]: e.target.value });

  const info = findLoginRole(roleSlug);
  if (!admin && !info) return <Navigate to="/login" replace />;

  const role: Role = admin ? "ADMIN" : info!.role;
  const label = admin ? "Admin" : info!.label;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: Partial<Fields> = {};
    if (!isEmail(f.email)) er.email = "Enter a valid email address.";
    if (!f.password) er.password = "Enter your password.";
    setErrors(er);
    setMsg("");
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const session = await login(f.email.trim(), f.password, role);
      if (session.user.role !== role) {
        setMsg(`This account is not a ${label.toLowerCase()} account. Please sign in with the correct role.`);
        return;
      }
      saveSession(session);
      nav(homePath(role), { replace: true });
    } catch (err) {
      setMsg(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={admin ? "Admin sign in" : `${label} login`} subtitle={admin ? undefined : info!.blurb}>
      {!admin && <Link className="back-link" to="/login">← Choose a different role</Link>}
      {msg && <div className="notice error" role="alert">{msg}</div>}
      <form onSubmit={submit} noValidate>
        <Field label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" value={f.email} onChange={set} error={errors.email} />
        <Field label="Password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" value={f.password} onChange={set} error={errors.password} />
        <Link className="forgot" to="/forgot-password">Forgot password?</Link>
        <button className="btn primary" disabled={busy}>{busy ? "Logging in..." : "Login"}</button>
      </form>

      {info?.google && (
        <>
          <p className="or">or</p>
          <button type="button" className="btn" onClick={() => setMsg("Google sign-in will be connected once the backend is ready.")}>Continue with Google</button>
        </>
      )}

      {!admin && !info!.canRegister && (
        <p className="hint" style={{ marginTop: 18 }}>{label} accounts are created by a SwiftDrop administrator.</p>
      )}

      <div className="links">
        {info?.role === "CUSTOMER" && <Link to="/get-a-quote">Get a Quote</Link>}
        {info?.canRegister && <Link to={`/register?type=${info.role}`}>New here? Create an account</Link>}
      </div>
    </AuthLayout>
  );
}

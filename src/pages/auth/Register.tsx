import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import Field from "../../components/Field";
import type { FieldChange } from "../../components/Field";
import { registerCustomer } from "../../api/auth";
import { isEmail, isPhone, isStrong } from "../../utils/validate";
import { errMessage } from "../../utils/errors";
import type { OkResponse } from "../../types";
import MerchantRegisterForm from "./MerchantRegisterForm";

type AccountType = "CUSTOMER" | "MERCHANT";

interface FormConfig {
  submit: (data: Record<string, string>) => Promise<OkResponse>;
  button: string;
  // fields: [name, label, type, placeholder]
  fields: [name: string, label: string, type: string, placeholder: string][];
}

const FORMS: Record<"CUSTOMER", FormConfig> = {
  CUSTOMER: {
    submit: registerCustomer,
    button: "Create account",
    fields: [
      ["fullName", "Full name", "text", "Your full name"],
      ["email", "Email", "email", "you@example.com"],
      ["phone", "Phone", "tel", "07X XXX XXXX"],
    ],
  },
};

export default function Register() {
  const location = useLocation();
  const [role, setRole] = useState<AccountType | "">(location.pathname === "/register/merchant" ? "MERCHANT" : "");
  const [v, setV] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const cfg = role === "CUSTOMER" ? FORMS.CUSTOMER : undefined;
  const set = (e: FieldChange) => setV({ ...v, [e.target.name]: e.target.value });

  function pickRole(e: FieldChange) {
    setRole(e.target.value as AccountType | "");
    setV({});
    setErrors({});
    setMsg("");
  }

  if (role === "MERCHANT") return <MerchantRegisterForm />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!cfg) return;
    const er: Record<string, string> = {};
    cfg.fields.forEach(([name, label]) => {
      if (!(v[name] || "").trim()) er[name] = `${label} is required.`;
    });
    if (!er.email && !isEmail(v.email)) er.email = "Enter a valid email address.";
    if (!er.phone && !isPhone(v.phone)) er.phone = "Enter a 10-digit number like 0771234567.";
    if (!isStrong(v.password || "")) er.password = "Use at least 8 characters with letters and numbers.";
    if (v.confirm !== v.password) er.confirm = "Passwords do not match.";
    setErrors(er);
    setMsg("");
    if (Object.keys(er).length) return;
    const { confirm: _confirm, ...payload } = v;
    setBusy(true);
    try {
      await cfg.submit(payload);
      setDone(true);
    } catch (err) {
      setMsg(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Account created">
        <div className="notice ok">Your account is ready. Log in to start sending parcels.</div>
        <Link className="btn primary" style={{ lineHeight: "46px", textAlign: "center", textDecoration: "none" }} to="/login">Go to login</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account">
      {msg && <div className="notice error" role="alert">{msg}</div>}
      <form onSubmit={submit} noValidate>
        <Field select label="I am registering as" value={role} onChange={pickRole}>
          <option value="">Select account type</option>
          <option value="CUSTOMER">Customer – I want to send parcels</option>
          <option value="MERCHANT">Merchant – I own a shop</option>
        </Field>

        {!cfg && <p className="hint">Choose an account type to see the registration form.</p>}

        {cfg && (
          <>
            {cfg.fields.map(([name, label, type, ph]) => (
              <Field key={name} label={label} name={name} type={type} placeholder={ph} value={v[name] || ""} onChange={set} error={errors[name]} />
            ))}
            <div className="password-field"><Field label="Password" name="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" autoComplete="new-password" value={v.password || ""} onChange={set} error={errors.password} /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div>
            <div className="password-field"><Field label="Confirm password" name="confirm" type={showPassword ? "text" : "password"} placeholder="Re-enter your password" autoComplete="new-password" value={v.confirm || ""} onChange={set} error={errors.confirm} /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div>
            <button className="btn primary" disabled={busy}>{busy ? "Please wait..." : cfg.button}</button>
          </>
        )}
      </form>

      {role === "CUSTOMER" && (
        <>
          <p className="or">or</p>
          <button type="button" className="btn" onClick={() => setMsg("Google sign-up will be connected once the backend is ready.")}>Continue with Google</button>
        </>
      )}
      <div className="links">
        <Link to="/login">Already have an account? Login</Link>
      </div>
    </AuthLayout>
  );
}

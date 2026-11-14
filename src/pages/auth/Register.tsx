import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import Field from "../../components/Field";
import type { FieldChange } from "../../components/Field";
import { registerCustomer, registerMerchant } from "../../api/auth";
import { isEmail, isPhone, isStrong } from "../../utils/validate";
import { errMessage } from "../../utils/errors";
import type { OkResponse } from "../../types";

type AccountType = "CUSTOMER" | "MERCHANT";

interface FormConfig {
  submit: (data: Record<string, string>) => Promise<OkResponse>;
  button: string;
  // fields: [name, label, type, placeholder]
  fields: [name: string, label: string, type: string, placeholder: string][];
}

const FORMS: Record<AccountType, FormConfig> = {
  CUSTOMER: {
    submit: registerCustomer,
    button: "Create account",
    fields: [
      ["fullName", "Full name", "text", "Your full name"],
      ["email", "Email", "email", "you@example.com"],
      ["phone", "Phone", "tel", "07X XXX XXXX"],
    ],
  },
  MERCHANT: {
    submit: registerMerchant,
    button: "Submit application",
    fields: [
      ["businessName", "Business name", "text", "Your shop or company name"],
      ["registrationNo", "Business registration number", "text", "e.g. PV 12345"],
      ["fullName", "Contact person", "text", "Owner or manager's full name"],
      ["email", "Business email", "email", "shop@example.com"],
      ["phone", "Business phone", "tel", "07X XXX XXXX"],
      ["address", "Business address", "text", "Street, city"],
    ],
  },
};

export default function Register() {
  const [params] = useSearchParams();
  const preset = params.get("type")?.toUpperCase();
  const [role, setRole] = useState<AccountType | "">(preset === "CUSTOMER" || preset === "MERCHANT" ? preset : "");
  const [v, setV] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const cfg = role ? FORMS[role] : undefined;
  const set = (e: FieldChange) => setV({ ...v, [e.target.name]: e.target.value });

  function pickRole(e: FieldChange) {
    setRole(e.target.value as AccountType | "");
    setV({});
    setErrors({});
    setMsg("");
  }

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
      <AuthLayout title={role === "MERCHANT" ? "Application submitted" : "Account created"}>
        <div className="notice ok">
          {role === "MERCHANT"
            ? "An admin will review your business details. You can log in once your account is approved."
            : "Your account is ready. Log in to start sending parcels."}
        </div>
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
            <Field label="Password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" value={v.password || ""} onChange={set} error={errors.password} />
            <Field label="Confirm password" name="confirm" type="password" placeholder="Re-enter your password" autoComplete="new-password" value={v.confirm || ""} onChange={set} error={errors.confirm} />
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

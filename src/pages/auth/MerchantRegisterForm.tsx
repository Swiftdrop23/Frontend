import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import Field from "../../components/Field";
import type { FieldChange } from "../../components/Field";
import { ApiError, registerMerchant } from "../../api/auth";
import { registerMerchantMock } from "../../api/merchant";
import { isEmail, isPhone, isStrong } from "../../utils/validate";
import { errMessage } from "../../utils/errors";

export default function MerchantRegisterForm() {
  const nav = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (event: FieldChange) =>
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const requiredFields: [string, string][] = [
      ["businessName", "Business name"],
      ["registrationNo", "Business registration number"],
      ["fullName", "Contact person"],
      ["email", "Business email"],
      ["phone", "Business phone"],
      ["address", "Business address"],
    ];
    requiredFields.forEach(([name, label]) => {
      if (!(values[name] || "").trim()) nextErrors[name] = `${label} is required.`;
    });
    if (!nextErrors.email && !isEmail(values.email)) nextErrors.email = "Enter a valid email address.";
    if (!nextErrors.phone && !isPhone(values.phone)) nextErrors.phone = "Enter a 10-digit number like 0771234567.";
    if (!isStrong(values.password || "")) nextErrors.password = "Use at least 8 characters with letters and numbers.";
    if (values.confirm !== values.password) nextErrors.confirm = "Passwords do not match.";

    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;

    const payload: Record<string, string> = {
      businessName: values.businessName || "",
      registrationNo: values.registrationNo || "",
      contactName: values.fullName || "",
      email: values.email || "",
      phone: values.phone || "",
      address: values.address || "",
      password: values.password || "",
    };
    setBusy(true);
    try {
      await registerMerchant(payload);
      await registerMerchantMock({
        businessName: payload.businessName,
        ownerName: payload.contactName,
        email: payload.email,
        phone: payload.phone,
        registrationNo: payload.registrationNo,
        address: payload.address,
      });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        if (Object.keys(error.fieldErrors).length) {
          const fieldErrors = Object.fromEntries(
            Object.entries(error.fieldErrors).map(([field, value]) => [
              field === "contactName" ? "fullName" : field,
              value,
            ]),
          );
          setErrors(fieldErrors);
        }
        if (error.status === 409) {
          const lowerMessage = error.message.toLowerCase();
          if (lowerMessage.includes("email")) setErrors((current) => ({ ...current, email: error.message }));
          if (lowerMessage.includes("registration")) setErrors((current) => ({ ...current, registrationNo: error.message }));
          setMessage(error.message);
        } else if (Object.keys(error.fieldErrors).length === 0) {
          setMessage(error.message);
        }
      } else {
        setMessage(errMessage(error));
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Application submitted">
        <div className="notice ok" role="status">
          ඔබගේ අයදුම්පත සම්පූර්ණයි. Admin approval බලාගෙන ඉන්න.
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => nav("/login", { replace: true })}
          style={{ lineHeight: "46px" }}
        >
          Go to login
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Merchant registration">
      {message && <div className="notice error" role="alert">{message}</div>}
      <form onSubmit={submit} noValidate>
        <Field label="Business name" name="businessName" value={values.businessName || ""} onChange={set} error={errors.businessName} />
        <Field label="Business registration number" name="registrationNo" value={values.registrationNo || ""} onChange={set} error={errors.registrationNo} />
        <Field label="Contact person" name="fullName" value={values.fullName || ""} onChange={set} error={errors.fullName} />
        <Field label="Business email" name="email" type="email" value={values.email || ""} onChange={set} error={errors.email} />
        <Field label="Business phone" name="phone" type="tel" value={values.phone || ""} onChange={set} error={errors.phone} />
        <Field label="Business address" name="address" value={values.address || ""} onChange={set} error={errors.address} />
        <div className="password-field">
          <Field label="Password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={values.password || ""} onChange={set} error={errors.password} />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
        </div>
        <div className="password-field">
          <Field label="Confirm password" name="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" value={values.confirm || ""} onChange={set} error={errors.confirm} />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
        </div>
        <button className="btn primary" disabled={busy}>{busy ? "Please wait..." : "Submit application"}</button>
      </form>
      <div className="links"><Link to="/login">Already have an account? Login</Link></div>
    </AuthLayout>
  );
}

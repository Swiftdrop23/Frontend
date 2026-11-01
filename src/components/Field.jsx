export default function Field({ label, error, select, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {select ? <select {...props}>{children}</select> : <input {...props} />}
      {error && <small className="err">{error}</small>}
    </label>
  );
}

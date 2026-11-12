import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveZone } from "./adminData";
import "./admin.css";

export default function ZoneForm() {
  const [name, setName] = useState("");
  const [areas, setAreas] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const zoneName = name.trim();
    const covered = areas.split(",").map((area) => area.trim()).filter(Boolean);
    if (!zoneName || covered.length === 0) { setError("Enter a zone name and at least one covered area."); return; }
    if (covered.length !== areas.split(",").filter((area) => area.trim()).length) { setError("Separate covered areas with commas."); return; }
    if (new Set(covered.map((area) => area.toLocaleLowerCase())).size !== covered.length) { setError("Remove duplicate covered areas."); return; }
    const id = `${zoneName.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
    setBusy(true);
    try {
      await saveZone({ id, name: zoneName, areas: covered, active });
      navigate("/admin/zones-pricing");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the zone.");
    } finally { setBusy(false); }
  }
  return <div className="admin-page admin-form-page"><form className="admin-panel admin-form" onSubmit={submit} noValidate>
    <h2>Zone details</h2>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <label className="admin-field"><span>Zone name</span><input autoFocus value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="e.g. Kandy" maxLength={80} /></label>
    <label className="admin-field"><span>Areas covered</span><textarea value={areas} onChange={(event) => { setAreas(event.target.value); setError(""); }} placeholder="List districts or cities, separated by commas" rows={2} maxLength={500} /></label>
    <label className="admin-switch"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span className="admin-switch-track" aria-hidden="true" /><span>Zone active</span></label>
    <div className="admin-form-actions"><button className="admin-button primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save zone"}</button><Link className="admin-button" to="/admin/zones-pricing">Cancel</Link></div>
  </form></div>;
}

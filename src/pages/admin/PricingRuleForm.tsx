import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRule, getRules, getZones, saveRule, type PricingRule, type Zone } from "./adminData";
import "./admin.css";

export default function PricingRuleForm() {
  const { ruleId = "", zoneId: requestedZoneId } = useParams();
  const creating = !ruleId || ruleId === "new";
  const [zones, setZones] = useState<Zone[]>([]);
  const [initial, setInitial] = useState<PricingRule>();
  const [loaded, setLoaded] = useState(false);
  const [zoneId, setZoneId] = useState("");
  const [size, setSize] = useState<PricingRule["size"]>("Small");
  const [baseFee, setBaseFee] = useState("");
  const [perKg, setPerKg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    Promise.all([getZones(), creating ? Promise.resolve(undefined) : getRule(ruleId)]).then(([loadedZones, loadedRule]) => {
      setZones(loadedZones); setInitial(loadedRule);
      setZoneId(loadedRule?.zoneId ?? (loadedZones.some((zone) => zone.id === requestedZoneId && zone.active) ? requestedZoneId : undefined) ?? loadedZones.find((zone) => zone.active)?.id ?? "");
      setSize(loadedRule?.size ?? "Small"); setBaseFee(loadedRule ? String(loadedRule.baseFee) : ""); setPerKg(loadedRule ? String(loadedRule.perKg) : "");
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not load pricing data."))
      .finally(() => setLoaded(true));
  }, [creating, requestedZoneId, ruleId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const base = Number(baseFee); const weight = Number(perKg);
    if (!zones.some((zone) => zone.id === zoneId && zone.active)) { setError("Select an active delivery zone."); return; }
    if (!baseFee.trim() || !perKg.trim() || !Number.isFinite(base) || !Number.isFinite(weight) || base < 0 || weight < 0) { setError("Enter valid non-negative fees for both fields."); return; }
    const duplicate = (await getRules()).some((rule) => rule.id !== ruleId && rule.zoneId === zoneId && rule.size === size);
    if (duplicate) { setError("A pricing rule for this zone and parcel size already exists."); return; }
    setBusy(true);
    try {
      await saveRule({ id: ruleId || `${zoneId}-${size.toLocaleLowerCase()}-${Date.now().toString(36)}`, zoneId, size, baseFee: base, perKg: weight }, creating);
      navigate("/admin/zones-pricing");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the pricing rule.");
    } finally { setBusy(false); }
  }
  if (!loaded) return <div className="admin-page admin-form-page"><section className="admin-panel" role="status">Loading pricing settings…</section></div>;
  if (!initial && !creating) return <div className="admin-page"><div className="admin-panel"><p className="admin-error">This pricing rule could not be found.</p><Link className="admin-button" to="/admin/zones-pricing">Back to Zones &amp; Pricing</Link></div></div>;
  return <div className="admin-page admin-form-page"><form className="admin-panel admin-form" onSubmit={submit} noValidate>
    <h2>Pricing rule</h2>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-form-grid">
      <label className="admin-field"><span>Zone</span><select value={zoneId} onChange={(event) => { setZoneId(event.target.value); setError(""); }}>{zones.filter((zone) => zone.active).map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
      <label className="admin-field"><span>Size</span><select value={size} onChange={(event) => setSize(event.target.value as PricingRule["size"])}>{(["Small", "Medium", "Large"] as const).map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="admin-field"><span>Base fee (LKR)</span><input type="number" min="0" step="0.01" inputMode="decimal" value={baseFee} onChange={(event) => { setBaseFee(event.target.value); setError(""); }} placeholder="0.00" /></label>
      <label className="admin-field"><span>Fee per kg (LKR)</span><input type="number" min="0" step="0.01" inputMode="decimal" value={perKg} onChange={(event) => { setPerKg(event.target.value); setError(""); }} placeholder="0.00" /></label>
    </div>
    <div className="admin-form-actions"><button className="admin-button primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save rule"}</button><Link className="admin-button" to="/admin/zones-pricing">Cancel</Link></div>
  </form></div>;
}

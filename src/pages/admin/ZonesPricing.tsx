import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRules, getZones, type PricingRule, type Zone } from "./adminData";
import "./admin.css";

export default function ZonesPricing() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getZones(), getRules()]).then(([loadedZones, loadedRules]) => {
      setZones(loadedZones); setRules(loadedRules);
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not load zones and pricing rules."))
      .finally(() => setLoading(false));
  }, []);
  const zoneById = new Map(zones.map((zone) => [zone.id, zone]));
  return (
    <div className="admin-page">
      <div className="admin-page-actions"><p className="admin-note">Zones and fees saved in the shared database.</p><Link className="admin-button primary" to="/admin/zones-pricing/add-zone">Add zone</Link></div>
      <section className="admin-panel" aria-label="Pricing rules">
        <div className="admin-section-head"><h2>Pricing rules</h2><Link className="admin-button" to="/admin/zones-pricing/add-rule">Add pricing rule</Link></div>
        {loading && <p className="admin-muted" role="status">Loading zones and pricing rules…</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}
        {!loading && !error && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Zone</th><th>Size</th><th>Base fee</th><th>Per kg</th><th aria-label="Actions" /></tr></thead>
          <tbody>{rules.map((rule) => {
            const zone = zoneById.get(rule.zoneId);
            return <tr key={rule.id}><td>{zone?.name ?? "Unknown zone"}{zone && !zone.active && <span className="admin-muted"> · inactive</span>}</td><td>{rule.size}</td><td>LKR {rule.baseFee.toLocaleString()}</td><td>LKR {rule.perKg.toLocaleString()}</td><td><Link className="admin-button" to={`/admin/zones-pricing/edit-rule/${rule.id}`}>Edit</Link></td></tr>;
          })}
          {zones.filter((zone) => !rules.some((rule) => rule.zoneId === zone.id)).map((zone) => <tr key={zone.id}><td>{zone.name}{!zone.active && <span className="admin-muted"> · inactive</span>}</td><td colSpan={3} className="admin-muted">No pricing rules yet</td><td><Link className="admin-button" to={`/admin/zones-pricing/add-rule/${zone.id}`}>Add rule</Link></td></tr>)}
          {!rules.length && !zones.length && <tr><td className="admin-empty" colSpan={5}>No zones or pricing rules yet. Add a zone to get started.</td></tr>}
          </tbody>
        </table></div>}
      </section>
      <p className="admin-sample">Updates are saved to the shared database.</p>
    </div>
  );
}

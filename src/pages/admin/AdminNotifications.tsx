import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMerchantApplications } from "../../api/merchants";
import { notificationApi } from "../../api/notifications";
import { getReportSummary } from "./adminData";
import "./admin.css";

/*
 * Member 10: what needs the admin's attention: merchant applications waiting for review, webhooks that failed
 * after all retries, and failed or cancelled deliveries this week. Each row links to the page that handles it.
 */

type Item = { key: string; count: number | null; title: string; detail: string; to: string; action: string };

const settle = async (p: Promise<number>): Promise<number | null> => { try { return await p; } catch { return null; } };

export default function AdminNotifications() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      settle(listMerchantApplications("PENDING").then((rows) => rows.length)),
      settle(notificationApi.failed().then((rows) => rows.length)),
      settle(getReportSummary().then((s) => s.failed)),
    ]).then(([merchants, webhooks, failed]) => {
      if (!active) return;
      setItems([
        { key: "merchants", count: merchants, title: "Merchant applications to review",
          detail: merchants ? "New businesses are waiting to start shipping with SwiftDrop." : "No applications waiting.",
          to: "/admin/merchant-approvals", action: "Review" },
        { key: "webhooks", count: webhooks, title: "Failed webhooks",
          detail: webhooks ? "Order updates that could not reach a merchant's server after all retries." : "All merchant updates were delivered.",
          to: "/admin/failed-webhooks", action: "Open" },
        { key: "failed", count: failed, title: "Failed or cancelled deliveries (last 7 days)",
          detail: failed ? "Check the delivery report for the days with problems." : "No failed deliveries this week.",
          to: "/admin/reports/delivery-report", action: "View report" },
      ]);
    });
    return () => { active = false; };
  }, []);

  const open = items?.filter((i) => (i.count ?? 0) > 0).length ?? 0;

  return (
    <div className="admin-page">
      <p className="admin-note">{items === null ? "Checking what needs your attention…" : open ? `${open} ${open === 1 ? "thing needs" : "things need"} your attention.` : "All clear. Nothing needs your attention right now."}</p>
      <section className="admin-panel" aria-label="Admin notifications">
        {items === null ? <p className="admin-muted" role="status">Loading…</p> : (
          <ul className="admin-alerts">
            {items.map((i) => (
              <li key={i.key}>
                <span className={(i.count ?? 0) > 0 ? "admin-alert-count hot" : "admin-alert-count"}>{i.count ?? "–"}</span>
                <div><strong>{i.title}</strong><span className="admin-muted">{i.count === null ? "Could not load this right now." : i.detail}</span></div>
                <Link className="admin-button" to={i.to}>{i.action}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

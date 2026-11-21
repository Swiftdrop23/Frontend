import { useCallback, useEffect, useState } from "react";
import { approveMerchant, listMerchantApplications, rejectMerchant } from "../../api/merchants";
import type { MerchantApplication, MerchantStatus } from "../../types";
import { Button, Card, Modal, StatusBadge, Table } from "../../components/ui";
import type { Column } from "../../components/ui";
import "./admin.css";

const TABS: { status: MerchantStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "APPROVED", label: "Approved" },
  { status: "REJECTED", label: "Rejected" },
];

export default function MerchantApprovals() {
  const [status, setStatus] = useState<MerchantStatus>("PENDING");
  const [applications, setApplications] = useState<MerchantApplication[]>([]);
  const [selected, setSelected] = useState<MerchantApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const load = useCallback(async (nextStatus = status) => {
    setLoading(true);
    setError("");
    try {
      setApplications(await listMerchantApplications(nextStatus));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load merchant applications.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load(status);
  }, [load, status]);

  function openApplication(application: MerchantApplication) {
    setSelected(application);
    setReason("");
    setReasonError("");
  }

  function closeModal() {
    if (!acting) setSelected(null);
  }

  async function approve(application: MerchantApplication) {
    if (!window.confirm(`Approve ${application.businessName}?`)) return;
    setActing(true);
    setError("");
    try {
      await approveMerchant(application.id);
      setSelected(null);
      setSuccess(`${application.businessName} has been approved.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not approve this application.");
    } finally {
      setActing(false);
    }
  }

  async function reject(application: MerchantApplication) {
    if (!reason.trim()) {
      setReasonError("A rejection reason is required.");
      return;
    }
    setActing(true);
    setReasonError("");
    setError("");
    try {
      await rejectMerchant(application.id, reason);
      setSelected(null);
      setSuccess(`${application.businessName} has been rejected.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reject this application.");
    } finally {
      setActing(false);
    }
  }

  const columns: Column<MerchantApplication>[] = [
    { header: "Business", render: (application) => <><strong>{application.businessName}</strong><span className="admin-muted">{application.registrationNo}</span></> },
    { header: "Reg no", render: (application) => application.registrationNo },
    { header: "Contact", render: (application) => application.contactName },
    { header: "Email", render: (application) => application.email },
    { header: "Phone", render: (application) => application.phone },
    { header: "Submitted date", render: (application) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(application.submittedAt)) },
    { header: "Status", render: (application) => <StatusBadge status={application.status} /> },
    { header: "Action", render: (application) => <Button variant="secondary" className="compact" onClick={() => openApplication(application)}>Review</Button> },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-actions">
        <div>
          <p className="eyebrow">Merchant management</p>
          <h2>Merchant approvals</h2>
        </div>
        <Button onClick={() => void load()}>Refresh</Button>
      </div>

      {success && <div className="notice ok" role="status">{success}</div>}
      {error && <p className="admin-error" role="alert">{error}</p>}

      <div className="merchant-status-tabs" role="tablist" aria-label="Merchant application status">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            role="tab"
            aria-selected={status === tab.status}
            className={status === tab.status ? "active" : ""}
            onClick={() => {
              setStatus(tab.status);
              setSuccess("");
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <p className="admin-muted" role="status">Loading merchant applications...</p>
        ) : (
          <Table
            columns={columns}
            rows={applications}
            rowKey={(application) => application.id}
            emptyMessage={status === "PENDING" ? "No pending applications." : `No ${status.toLowerCase()} applications.`}
          />
        )}
      </Card>

      <Modal
        open={selected !== null}
        title="Merchant application"
        onClose={closeModal}
        footer={selected?.status === "PENDING" ? (
          <>
            <Button variant="danger" onClick={() => void reject(selected)} loading={acting} disabled={acting}>Reject</Button>
            <Button variant="primary" onClick={() => void approve(selected)} loading={acting} disabled={acting}>Approve</Button>
          </>
        ) : undefined}
      >
        {selected && (
          <div className="merchant-detail">
            <dl>
              <div><dt>Business</dt><dd>{selected.businessName}</dd></div>
              <div><dt>Registration no</dt><dd>{selected.registrationNo}</dd></div>
              <div><dt>Contact person</dt><dd>{selected.contactName}</dd></div>
              <div><dt>Email</dt><dd>{selected.email}</dd></div>
              <div><dt>Phone</dt><dd>{selected.phone}</dd></div>
              <div><dt>Address</dt><dd>{selected.address}</dd></div>
              <div><dt>Submitted date</dt><dd>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.submittedAt))}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge status={selected.status} /></dd></div>
              {selected.rejectionReason && <div><dt>Rejection reason</dt><dd>{selected.rejectionReason}</dd></div>}
            </dl>
            {selected.status === "PENDING" && (
              <label className="merchant-rejection">
                <span>Rejection reason (required)</span>
                <textarea
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    if (reasonError) setReasonError("");
                  }}
                  placeholder="Explain why this application is rejected"
                />
                {reasonError && <small className="err">{reasonError}</small>}
              </label>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { demoMode, localAccess, getDeliveries, resetDemo, today, updateStatus, uploadProof } from './courierApi';
import { isComplete, labels as statusLabels, reasons, transitions as statusTransitions, validateUpdate } from './statusRules';
import './courier.css';
import type { ChangeEvent, FormEvent } from 'react';
import type { Delivery, StatusUpdate } from './types';

const labels: Record<string, string> = statusLabels;
const transitions: Record<string, string[]> = statusTransitions;

const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('en-LK', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Colombo' }).format(new Date(value)) : '';
function Badge({ status }: { status: string }) { return <span className={`courier-badge courier-${status.toLowerCase()}`}>{labels[status] || status}</span>; }
function UpdateForm({ delivery, failed, onSave, onCancel }: { delivery: Delivery; failed: boolean; onSave: (id: number, body: StatusUpdate) => Promise<void>; onCancel: () => void }) {
  const next = transitions[delivery.status].filter(s => s !== 'FAILED');
  const [form, setForm] = useState({ status: failed ? 'FAILED' : next[0], recipientName: '', failureReason: '', note: '' });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!file) { setPreview(''); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  const set = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const body: StatusUpdate = { ...form, version: delivery.version };
      validateUpdate(delivery, { ...body, proofId: file ? 'pending-upload' : null });
      if (form.status === 'DELIVERED' && file) body.proofId = (await uploadProof(delivery.id, file)).id;
      await onSave(delivery.id, body);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update delivery.'); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="courier-form">
    <div className="courier-card courier-summary"><div><strong>{delivery.trackingNumber}</strong><p>{delivery.receiverName}</p></div><Badge status={delivery.status}/></div>
    <fieldset disabled={busy}>
      <legend>{failed ? 'Failure reason (required)' : 'New status'}</legend>
      {(failed ? reasons : next).map(value => <label className="courier-radio" key={value}><input type="radio" name={failed ? 'failureReason' : 'status'} value={value} checked={(failed ? form.failureReason : form.status) === value} onChange={set}/>{failed ? value : labels[value]}</label>)}
    </fieldset>
    {form.status === 'DELIVERED' && <>
      <label>Recipient name<input name="recipientName" maxLength={120} value={form.recipientName} onChange={set} disabled={busy} placeholder="Who received the parcel?"/></label>
      <p className="courier-muted">Add a recipient name or photo proof.</p>
      <label className="courier-upload">{file ? 'Change proof photo' : '+ Add photo proof'}<input type="file" accept="image/jpeg,image/png" disabled={busy} onChange={e => { const chosen = e.target.files?.[0]; if (chosen && (!['image/jpeg', 'image/png'].includes(chosen.type) || chosen.size > 5 * 1024 * 1024)) { setError('Choose a JPEG or PNG up to 5 MB.'); e.target.value = ''; return; } setError(''); setFile(chosen || null); }}/><small>JPEG or PNG · up to 5 MB</small></label>
      {preview && <div className="courier-proof"><img src={preview} alt="Selected delivery proof"/><span>{file?.name}</span><button type="button" onClick={() => setFile(null)} disabled={busy}>Remove photo</button></div>}
      {demoMode && <p className="courier-muted">Demo photos are previewed only. Image files are not saved.</p>}
    </>}
    <label>{failed && form.failureReason === 'Other' ? 'Describe the reason (required)' : 'Delivery note (optional)'}<textarea name="note" maxLength={1000} rows={3} value={form.note} onChange={set} disabled={busy} placeholder="Add helpful details"/></label>
    {error && <p className="courier-error" role="alert">{error}</p>}
    <div className="courier-actions"><button className={failed ? 'courier-danger' : 'courier-primary'} disabled={busy}>{busy ? 'Saving…' : failed ? 'Mark as failed' : 'Save status'}</button><button type="button" disabled={busy} onClick={onCancel}>Cancel</button></div>
  </form>;
}

export default function CourierApp({ embedded = false }) {
  const Content = embedded ? 'section' : 'main';
  const [date, setDate] = useState(today);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [tab, setTab] = useState('active');
  const [selected, setSelected] = useState<number | null>(null);
  const [screen, setScreen] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { let live = true; setLoading(true); setError(''); getDeliveries(date).then(data => { if (live) setDeliveries(data); }).catch(err => { if (live) setError(err instanceof Error ? err.message : 'Unable to update delivery.'); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [date, reload]);
  useEffect(() => { heading.current?.focus(); }, [screen, selected]);
  const delivery = deliveries.find(d => d.id === selected);
  const active = deliveries.filter(d => !isComplete(d.status));
  const completed = deliveries.filter(d => isComplete(d.status));
  const visible = (tab === 'active' ? active : completed).filter(d => `${d.trackingNumber} ${d.receiverName} ${d.receiverAddress}`.toLowerCase().includes(search.toLowerCase()));
  function open(id: number, page = 'details') { setSelected(id); setScreen(page); setNotice(''); }
  function back() { setScreen('list'); setSelected(null); }
  async function save(id: number, body: StatusUpdate) { const updated = await updateStatus(id, body); setDeliveries(all => all.map(d => d.id === id ? updated : d)); setNotice(`${updated.trackingNumber} updated to ${labels[updated.status]}.`); setTab(isComplete(updated.status) ? 'completed' : 'active'); back(); }
  return <div className={`courier-app${embedded ? ' courier-embedded' : ''}`}>
    <aside className="courier-sidebar"><a className="courier-brand" href="./preview.html">SwiftDrop<span>COURIER WORKSPACE</span></a><p className="courier-side-label">YOUR ROUTE</p><button className={tab === 'active' ? 'courier-nav selected' : 'courier-nav'} onClick={() => { setTab('active'); back(); }}>Today's deliveries <span>{active.length}</span></button><button className={tab === 'completed' ? 'courier-nav selected' : 'courier-nav'} onClick={() => { setTab('completed'); back(); }}>Completed <span>{completed.length}</span></button><div className="courier-side-bottom"><span className="courier-avatar">C</span><div>Courier workspace<small>{demoMode ? 'Independent demo' : 'Connected API'}</small></div></div></aside>
    <div className="courier-workspace"><header className="courier-top"><span>Operations <span className="courier-muted">/ Courier</span></span><span className="courier-mode">{demoMode ? '● Demo mode' : '● API mode'}</span></header>
    <Content className="courier-main">
      <div className="courier-page-heading"><div><p className="courier-eyebrow">SWIFTDROP / LAST MILE</p><h1 tabIndex={-1} ref={heading}>{screen === 'list' ? tab === 'active' ? 'Your deliveries, today.' : 'Completed deliveries' : screen === 'update' ? 'Update status' : screen === 'failed' ? 'Mark as failed' : delivery?.trackingNumber || 'Delivery details'}</h1><p className="courier-muted">{screen === 'list' ? 'A clear view of every stop. Keep each delivery moving.' : 'Check the details before updating this delivery.'}</p></div>{screen !== 'list' && <button onClick={back}>← Back to deliveries</button>}</div>
      {demoMode && <div className="courier-demo"><span>Demo workspace · Sample deliveries only. No changes are sent to your group database.</span><button onClick={() => { if (window.confirm('Reset all courier demo changes?')) { resetDemo(); back(); setReload(n => n + 1); setNotice('Demo reset.'); } }}>Reset demo</button></div>}
      {!demoMode && <div className="courier-demo"><span>{localAccess ? 'Live Neon database · Local development courier (member7-local). Team login is not connected yet.' : 'Live database · Changes are saved to the server.'}</span></div>}
      {notice && <div className="courier-success" role="status">✓ {notice}</div>}
      {screen === 'list' && <>
        <div className="courier-stats"><div><span>ACTIVE DELIVERIES</span><strong>{active.length.toString().padStart(2, '0')}</strong><small>Stops still to complete</small></div><div><span>DELIVERED</span><strong>{completed.filter(d => d.status === 'DELIVERED').length.toString().padStart(2, '0')}</strong><small>Successfully handed over</small></div><div><span>FAILED ATTEMPTS</span><strong>{completed.filter(d => d.status === 'FAILED').length.toString().padStart(2, '0')}</strong><small>Recorded with a reason</small></div></div>
        <div className="courier-toolbar"><div className="courier-tabs"><button aria-pressed={tab === 'active'} onClick={() => setTab('active')}>Active ({active.length})</button><button aria-pressed={tab === 'completed'} onClick={() => setTab('completed')}>Completed ({completed.length})</button></div><label className="courier-date">Delivery date<input type="date" value={date} onChange={e => setDate(e.target.value || today())}/></label></div>
        <div className="courier-search"><input aria-label="Search deliveries" placeholder="Search tracking number, recipient or address…" value={search} onChange={e => setSearch(e.target.value)}/><button onClick={() => setReload(n => n + 1)} disabled={loading}>Refresh</button></div>
      </>}
      {loading ? <div className="courier-empty" role="status">Loading your deliveries…</div> : error ? <div className="courier-empty" role="alert"><p>{error}</p><button onClick={() => setReload(n => n + 1)}>Try again</button></div> : screen === 'list' ? <div className="courier-grid">{visible.length ? visible.map(d => <article className="courier-card" key={d.id}><div className="courier-card-head"><span className="courier-parcel-icon" aria-hidden="true">▣</span><Badge status={d.status}/></div><h2>{d.trackingNumber}</h2><p className="courier-recipient">{d.receiverName}</p><p className="courier-address">{d.receiverAddress}</p><div className="courier-card-meta"><span>{d.weightKg != null ? `${d.weightKg} kg` : 'Weight not provided'}</span><span>{d.completedAt ? time(d.completedAt) : 'Assigned delivery'}</span></div>{d.failureReason && <p className="courier-failure-note">{d.failureReason}</p>}<div className="courier-actions"><button onClick={() => open(d.id)}>View details</button>{!isComplete(d.status) && <button className="courier-primary" onClick={() => open(d.id, 'update')}>Update status →</button>}</div></article>) : <div className="courier-empty"><h2>{search ? 'No matching deliveries' : 'No deliveries here yet'}</h2><p>{search ? 'Try a different tracking number or recipient.' : 'Assignments and completed deliveries will appear here.'}</p></div>}</div> : !delivery ? <div className="courier-empty">Delivery not found. <button onClick={back}>Back to list</button></div> : screen === 'update' || screen === 'failed' ? <UpdateForm key={`${delivery.id}-${screen}`} delivery={delivery} failed={screen === 'failed'} onSave={save} onCancel={() => setScreen('details')}/> : <div className="courier-details">
        <section className="courier-card"><div className="courier-card-head"><span className="courier-eyebrow">RECIPIENT</span><Badge status={delivery.status}/></div><h2>{delivery.receiverName}</h2><p>{delivery.receiverAddress}</p><div className="courier-actions">{delivery.receiverPhone ? <a className="courier-button" href={`tel:${delivery.receiverPhone}`}>Call recipient</a> : <span className="courier-muted">Phone number not provided</span>}<a className="courier-button" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.receiverAddress)}`} target="_blank" rel="noreferrer">Open in Maps ↗</a></div></section>
        <section className="courier-card"><h2>Parcel details</h2><dl><div><dt>Weight</dt><dd>{delivery.weightKg != null ? `${delivery.weightKg} kg` : 'Not provided'}</dd></div><div><dt>Scheduled date</dt><dd>{delivery.scheduledDate}</dd></div><div><dt>Instructions</dt><dd>{delivery.instructions || 'No special instructions'}</dd></div>{delivery.recipientName && <div><dt>Received by</dt><dd>{delivery.recipientName}</dd></div>}{delivery.failureReason && <div><dt>Failure reason</dt><dd>{delivery.failureReason}</dd></div>}{delivery.note && <div><dt>Delivery note</dt><dd>{delivery.note}</dd></div>}{delivery.proofId && <div><dt>Photo proof</dt><dd>{demoMode ? 'Demo selection only; photo not stored' : 'Uploaded securely'}</dd></div>}</dl></section>
        {!isComplete(delivery.status) && <div className="courier-actions"><button className="courier-primary" onClick={() => setScreen('update')}>Update status</button>{transitions[delivery.status].includes('FAILED') && <button className="courier-danger-outline" onClick={() => setScreen('failed')}>Mark as failed</button>}</div>}
      </div>}
      <footer className="courier-footer">SwiftDrop Courier · All dates and times in Sri Lanka time</footer>
    </Content></div>
  </div>;
}

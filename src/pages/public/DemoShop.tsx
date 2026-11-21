import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import "./demoShop.css";

/*
 * Member 10: "Demo Mart", a pretend online shop that shows the merchant integration end to end.
 * A shopper buys here (not on SwiftDrop); on Place order the shop uses its SwiftDrop API key to create the
 * delivery, exactly as a real shop's server would. Demo only: a real shop keeps its key on its server.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
// The shop owner sets the shop's SwiftDrop key once (like a server setting): VITE_DEMO_SHOP_CLIENT_ID / _SECRET in .env.local.
const SHOP_KEY = {
  clientId: (import.meta.env.VITE_DEMO_SHOP_CLIENT_ID as string | undefined)?.trim() ?? "",
  clientSecret: (import.meta.env.VITE_DEMO_SHOP_CLIENT_SECRET as string | undefined)?.trim() ?? "",
};

interface Product { id: string; name: string; category: string; price: number; weightKg: number; icon: string; tint: string; ink: string }

const PRODUCTS: Product[] = [
  { id: "shoes", name: "Everyday running shoes", category: "Footwear", price: 8900, weightKg: 1.2, icon: "shoe", tint: "#E1F5EE", ink: "#085041" },
  { id: "tshirt", name: "Cotton crew-neck T-shirt", category: "Clothing", price: 2450, weightKg: 0.3, icon: "shirt", tint: "#F1EFE8", ink: "#444441" },
  { id: "notebooks", name: "Notebook set (3 pack)", category: "Books", price: 1650, weightKg: 0.8, icon: "book", tint: "#E6F1FB", ink: "#0C447C" },
  { id: "headphones", name: "Wireless headphones", category: "Electronics", price: 12500, weightKg: 0.6, icon: "audio", tint: "#FBEAF0", ink: "#72243E" },
];

const money = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;

async function postJson(path: string, body: unknown, token?: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = text ? (JSON.parse(text) as Record<string, unknown>) : {}; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(String(data.message ?? data.error ?? `Request failed (${res.status})`));
  return data;
}

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "shoe": return <svg {...common}><path d="M2 16v-3l4-1 3-4 3 2 3 2 5 1a2 2 0 0 1 2 2v1H2z" /><path d="M2 16h20v2H2z" /></svg>;
    case "shirt": return <svg {...common}><path d="M8 3l-5 3 2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z" /></svg>;
    case "book": return <svg {...common}><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" /><path d="M20 4h-4a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h5z" /></svg>;
    case "audio": return <svg {...common}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></svg>;
    case "bag": return <svg {...common}><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
    case "truck": return <svg {...common}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>;
    case "check": return <svg {...common}><path d="M5 12l5 5L20 7" /></svg>;
    default: return null;
  }
}

export default function DemoShop() {
  const [step, setStep] = useState<"shop" | "checkout" | "placed">("shop");
  const [product, setProduct] = useState<Product>(PRODUCTS[0]);
  const [form, setForm] = useState({ name: "", address: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<{ order: string; tracking: string; name: string } | null>(null);
  const key = SHOP_KEY;
  const connected = Boolean(key.clientId && key.clientSecret);

  const buy = (p: Product) => {
    setProduct(p);
    setError("");
    setStep("checkout");
  };

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.address.trim()) { setError("Enter your name and delivery address."); return; }
    if (!connected) { setError("Sorry, this shop can't take orders right now. Please try again later."); return; }
    setBusy(true);
    setError("");
    try {
      const auth = await postJson("/v1/merchant/auth/token", { clientId: key.clientId, clientSecret: key.clientSecret });
      const token = String(auth.accessToken ?? auth.access_token ?? auth.token ?? "");
      if (!token) throw new Error("The shop could not sign in to SwiftDrop.");
      const orderNo = `DM-${Math.floor(1000 + Math.random() * 9000)}`;
      const order = await postJson("/v1/merchant/orders", {
        externalReference: orderNo, recipientName: form.name.trim(), dropoffAddress: form.address.trim(), weightKg: product.weightKg,
      }, token);
      setPlaced({ order: orderNo, tracking: String(order.trackingNumber ?? ""), name: form.name.trim().split(/\s+/)[0] });
      setStep("placed");
    } catch (e) {
      setError(`We couldn't place your order: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const restart = () => { setForm({ name: "", address: "" }); setPlaced(null); setStep("shop"); };

  return (
    <div className="dm">
      <header className="dm-header">
        <div className="dm-wrap dm-header-row">
          <button type="button" className="dm-brand" onClick={restart}>
            <span className="dm-logo"><Icon name="bag" size={18} /></span>Demo Mart
          </button>
          <span className="dm-badge"><Icon name="truck" size={16} />Delivered by SwiftDrop</span>
        </div>
      </header>

      <main className="dm-wrap dm-main">
        {!connected && (
          <p className="dm-setup" role="note">
            This shop isn't connected to SwiftDrop yet. Shop owner: create a key in SwiftDrop → API Keys and add
            VITE_DEMO_SHOP_CLIENT_ID and VITE_DEMO_SHOP_CLIENT_SECRET to .env.local, then restart the dev server.
          </p>
        )}
        {step === "shop" && (
          <>
            <section className="dm-hero">
              <p className="dm-eyebrow">Everyday essentials</p>
              <h1>Order today, at your door island-wide</h1>
              <p>Pick a product and check out in under a minute. You get a tracking number the moment you order.</p>
            </section>
            <section aria-label="Products" className="dm-grid">
              {PRODUCTS.map((p) => (
                <article key={p.id} className="dm-card">
                  <div className="dm-art" style={{ background: p.tint, color: p.ink }}><Icon name={p.icon} size={56} /></div>
                  <div className="dm-card-body">
                    <span className="dm-cat">{p.category}</span>
                    <h2>{p.name}</h2>
                    <span className="dm-muted">Parcel weight {p.weightKg} kg</span>
                    <div className="dm-card-foot">
                      <strong>{money(p.price)}</strong>
                      <button type="button" className="dm-btn" onClick={() => buy(p)}>Buy</button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}

        {step === "checkout" && (
          <section className="dm-checkout">
            <form className="dm-panel" onSubmit={placeOrder} noValidate>
              <h1>Where should we deliver?</h1>
              <label className="dm-field">Full name
                <input value={form.name} placeholder="Kamal Silva" autoComplete="name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="dm-field">Delivery address
                <input value={form.address} placeholder="12 Temple Road, Kandy" autoComplete="street-address" onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
              <p className="dm-hint">Write the town after a comma so the courier finds you.</p>
              {error && <p className="dm-error" role="alert">{error}</p>}
              <div className="dm-row">
                <button type="submit" className="dm-btn" disabled={busy}>{busy ? "Placing order…" : "Place order"}</button>
                <button type="button" className="dm-btn ghost" onClick={() => setStep("shop")}>Back to shop</button>
              </div>
            </form>
            <aside className="dm-panel dm-summary" aria-label="Your order">
              <h2>Your order</h2>
              <div className="dm-line"><span>{product.name} × 1</span><span>{money(product.price)}</span></div>
              <div className="dm-line dm-muted"><span>Delivery</span><span>SwiftDrop</span></div>
              <div className="dm-line dm-total"><span>Total</span><span>{money(product.price)}</span></div>
              <p className="dm-hint">You'll get a SwiftDrop tracking number right away.</p>
            </aside>
          </section>
        )}

        {step === "placed" && placed && (
          <section className="dm-panel dm-done">
            <div className="dm-done-head">
              <span className="dm-tick"><Icon name="check" size={22} /></span>
              <div>
                <h1>Thanks, {placed.name}. Your order is placed</h1>
                <p className="dm-muted">Order {placed.order} · {product.name}</p>
              </div>
            </div>
            <div className="dm-tracking">
              <div>
                <span className="dm-muted">SwiftDrop tracking number</span>
                <strong>{placed.tracking || "Pending"}</strong>
              </div>
              {placed.tracking && <Link className="dm-btn" to={`/track/${encodeURIComponent(placed.tracking)}`}>Track your parcel</Link>}
            </div>
            <ol className="dm-next">
              <li>Demo Mart sent your order to SwiftDrop</li>
              <li>A courier picks it up from the shop</li>
              <li>Follow it live with the tracking number</li>
            </ol>
            <button type="button" className="dm-btn ghost" onClick={restart}>Continue shopping</button>
          </section>
        )}

      </main>

      <footer className="dm-footer"><div className="dm-wrap">Demo Mart is a demo shop for the SwiftDrop merchant integration.</div></footer>
    </div>
  );
}

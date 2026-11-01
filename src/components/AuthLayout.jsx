import BrandArt from "./BrandArt";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth">
      <section className="auth-brand">
        <div>
          <h1>SwiftDrop</h1>
          <p>Send and track parcels island-wide.</p>
        </div>
        <BrandArt />
      </section>
      <main className="auth-panel">
        <div className="auth-card">
          <h2>{title}</h2>
          {subtitle && <p className="sub">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
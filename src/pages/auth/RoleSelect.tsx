import { Link } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { LOGIN_ROLES } from "../../config/roles";
import "./auth-roles.css";

// Main login page (/login): the user picks a role, then signs in on that role's own form.
export default function RoleSelect() {
  return (
    <AuthLayout title="Welcome back" subtitle="Choose how you want to sign in.">
      <nav className="role-list" aria-label="Sign in as">
        {LOGIN_ROLES.map((r) => (
          <Link key={r.role} className="role-btn" to={`/login/${r.slug}`}>
            <span className="role-icon" aria-hidden="true">{r.icon}</span>
            <span className="role-text">
              <strong>{r.label}</strong>
              <small>{r.blurb}</small>
            </span>
            <span className="role-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>
      <div className="links">
        <Link to="/get-a-quote">Get a Quote</Link>
        <Link to="/register">New here? Create an account</Link>
      </div>
    </AuthLayout>
  );
}

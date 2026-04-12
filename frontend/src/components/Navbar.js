import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AIChatbot from "./AIChatbot";

const ROLE_LINKS = {
  donor: [
    { to: "/dashboard", label: "Home" },
    { to: "/donor", label: "My Donations" },
  ],
  ngo: [
    { to: "/dashboard", label: "Home" },
    { to: "/ngo", label: "NGO Portal" },
  ],
  volunteer: [
    { to: "/dashboard", label: "Home" },
    { to: "/volunteer", label: "Deliveries" },
  ],
  admin: [
    { to: "/dashboard", label: "Home" },
    { to: "/admin", label: "Admin Panel" },
  ],
};

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = user ? ROLE_LINKS[user.role] || [] : [];

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const ROLE_BADGE = {
    donor: { label: "Donor", bg: "#D4A853", color: "#fff" },
    ngo: { label: "NGO", bg: "#2D6A4F", color: "#fff" },
    volunteer: { label: "Volunteer", bg: "#40916C", color: "#fff" },
    admin: { label: "Admin", bg: "#1B4332", color: "#E8C07A" },
  };
  const badge = user ? ROLE_BADGE[user.role] : null;

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          background: scrolled ? "rgba(27,67,50,0.97)" : "#1B4332",
          backdropFilter: "blur(12px)",
          borderBottom: scrolled
            ? "1px solid rgba(116,198,157,0.15)"
            : "1px solid rgba(116,198,157,0.1)",
          transition: "all .3s ease",
          boxShadow: scrolled ? "0 4px 24px rgba(27,67,50,0.3)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 1.5rem",
            height: 64,
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          {/* Logo */}
          <Link
            to="/dashboard"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "linear-gradient(135deg, #74C69D, #40916C)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(116,198,157,0.4)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                  fill="rgba(255,255,255,0.2)"
                />
                <path
                  d="M8 12l3 3 5-5"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 6v2M12 16v2M6 12H4M20 12h-2"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: "-0.3px",
                  lineHeight: 1.1,
                }}
              >
                Sahaara
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(116,198,157,0.9)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Welfare Network
              </div>
            </div>
          </Link>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {links.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    textDecoration: "none",
                    color: active ? "#fff" : "rgba(255,255,255,0.65)",
                    background: active
                      ? "rgba(116,198,157,0.2)"
                      : "transparent",
                    fontWeight: active ? 500 : 400,
                    border: active
                      ? "1px solid rgba(116,198,157,0.3)"
                      : "1px solid transparent",
                    transition: "all .2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.target.style.color = "#fff";
                    e.target.style.background = "rgba(116,198,157,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.target.style.color = "rgba(255,255,255,0.65)";
                      e.target.style.background = "transparent";
                    }
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* User area */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {badge && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: badge.bg,
                    color: badge.color,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {badge.label}
                </span>
              )}
              <div style={{ textAlign: "right", display: "none" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>
                  {user.name}
                </div>
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #D4A853, #E8C07A)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1B4332",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(212,168,83,0.4)",
                }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: "6px 14px",
                  fontSize: 13,
                  border: "1px solid rgba(116,198,157,0.3)",
                  borderRadius: 8,
                  background: "transparent",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.7)",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.1)";
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "rgba(255,255,255,0.7)";
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
      {user && <AIChatbot userRole={user.role} />}
    </>
  );
}

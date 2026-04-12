import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

const DEMO = [
  {
    role: "Admin",
    email: "admin@example.com",
    pass: "Admin@123",
    color: "#1B4332",
  },
  {
    role: "Donor",
    email: "priya@donor.com",
    pass: "Donor@123",
    color: "#2D6A4F",
  },
  { role: "NGO", email: "care@ngo.com", pass: "NGO@1234", color: "#40916C" },
  {
    role: "Volunteer",
    email: "arjun@vol.com",
    pass: "Vol@1234",
    color: "#D4A853",
  },
];

// Real welfare/community images from Unsplash (free, no key needed)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await login(form);
      loginUser(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#FEFAE0" }}>
      {/* LEFT — Image Panel */}
      <div
        style={{
          flex: "0 0 48%",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(160deg, rgba(27,67,50,0.6) 0%, rgba(27,67,50,0.92) 100%)",
          }}
        />

        {/* Content over image */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "3rem",
            animation: "fadeUp .8s ease both",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: "3rem",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "linear-gradient(135deg,#74C69D,#40916C)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 12l3 3 5-5"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                Sahaara
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(116,198,157,0.9)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Welfare Network
              </div>
            </div>
          </div>

          {/* Quote */}
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'Playfair Display',serif",
              lineHeight: 1.25,
              marginBottom: 20,
            }}
          >
            Connecting
            <br />
            kindness with
            <br />
            those in need.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.7,
              marginBottom: "2.5rem",
              maxWidth: 340,
            }}
          >
            An AI-powered platform that matches surplus resources with NGOs and
            volunteers to create meaningful impact in communities.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32 }}>
            {[
              ["-", "Donations Made"],
              ["-", "NGOs Served"],
              ["94%", "Delivery Rate"],
            ].map(([num, label]) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#D4A853",
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {num}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                    marginTop: 2,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Form Panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#FEFAE0",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            animation: "fadeUp .7s .1s ease both",
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1B4332",
              fontFamily: "'Playfair Display',serif",
              marginBottom: 6,
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: "#6B6560", marginBottom: "2rem" }}>
            Sign in to your account to continue
          </p>

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 13,
                color: "#991B1B",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1B4332",
                  marginBottom: 6,
                }}
              >
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 14,
                  border: "1.5px solid #D4C9A8",
                  borderRadius: 10,
                  outline: "none",
                  background: "#fff",
                  color: "#1C1C1A",
                  transition: "border .2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2D6A4F")}
                onBlur={(e) => (e.target.style.borderColor = "#D4C9A8")}
              />
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1B4332",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={form.password}
                required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 14,
                  border: "1.5px solid #D4C9A8",
                  borderRadius: 10,
                  outline: "none",
                  background: "#fff",
                  color: "#1C1C1A",
                  transition: "border .2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2D6A4F")}
                onBlur={(e) => (e.target.style.borderColor = "#D4C9A8")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                fontSize: 15,
                fontWeight: 600,
                background: loading
                  ? "#74C69D"
                  : "linear-gradient(135deg, #1B4332, #2D6A4F)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 16px rgba(27,67,50,0.3)",
                transition: "all .2s",
                letterSpacing: "0.02em",
              }}
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              fontSize: 13,
              color: "#6B6560",
            }}
          >
            New to Sahaara?{" "}
            <Link
              to="/register"
              style={{
                color: "#2D6A4F",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create an account
            </Link>
          </p>

          {/* Demo credentials */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1.25rem",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #E8DDB5",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#1B4332",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Quick demo access
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              {DEMO.map((d) => (
                <button
                  key={d.role}
                  onClick={() => setForm({ email: d.email, password: d.pass })}
                  style={{
                    padding: "8px 10px",
                    fontSize: 12,
                    border: `1px solid ${d.color}30`,
                    borderRadius: 8,
                    background: `${d.color}08`,
                    cursor: "pointer",
                    color: d.color,
                    fontWeight: 500,
                    textAlign: "left",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${d.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${d.color}08`;
                  }}
                >
                  <span style={{ display: "block", fontWeight: 600 }}>
                    {d.role}
                  </span>
                  <span style={{ color: "#888", fontSize: 11 }}>{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

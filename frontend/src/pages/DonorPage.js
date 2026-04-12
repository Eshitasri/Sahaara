import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { createDonation, getDonations } from "../services/api";
// import { useAuth } from "../context/AuthContext"; Unused var is creating hindrance while deploying

const CATEGORIES = [
  {
    value: "food_cooked",
    label: "Cooked Food",
    emoji: "🍱",
    color: "#2D6A4F",
    bg: "#EAF5EE",
  },
  {
    value: "food_raw",
    label: "Raw Food",
    emoji: "🌾",
    color: "#1B4332",
    bg: "#D8F3DC",
  },
  {
    value: "clothes",
    label: "Clothes",
    emoji: "👕",
    color: "#D4A853",
    bg: "#FFF3CD",
  },
  {
    value: "medicines",
    label: "Medicines",
    emoji: "💊",
    color: "#8B3A8B",
    bg: "#F3E8F3",
  },
  {
    value: "books",
    label: "Books",
    emoji: "📚",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    value: "other",
    label: "Other",
    emoji: "📦",
    color: "#6B6560",
    bg: "#F5F4F0",
  },
];

const STATUS = {
  available: { label: "Available", bg: "#D8F3DC", color: "#1B4332" },
  matched: { label: "Matched", bg: "#EFF6FF", color: "#1D4ED8" },
  pickup_confirmed: {
    label: "Pickup Confirmed",
    bg: "#FFF3CD",
    color: "#92400E",
  },
  delivered: { label: "Delivered ✓", bg: "#D8F3DC", color: "#1B4332" },
  cancelled: { label: "Cancelled", bg: "#FEE2E2", color: "#991B1B" },
  expired: { label: "Expired", bg: "#F5F4F0", color: "#6B6560" },
};

const HERO =
  "https://images.unsplash.com/photo-1593113630400-ea4288922559?w=900&q=80";

const inp = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 14,
  border: "1.5px solid #D4C9A8",
  borderRadius: 10,
  outline: "none",
  background: "#fff",
  color: "#1C1C1A",
  boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border .2s",
};

export default function DonorPage() {
  //const { user } = useAuth();   Unused var is creating hindrance while deploying
  const [tab, setTab] = useState("upload");
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState({
    category: "food_cooked",
    title: "",
    description: "",
    quantity: "",
    pickupAddress: "",
  });
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    if (tab === "history") fetchDonations();
  }, [tab]);

  const fetchDonations = async () => {
    setFetching(true);
    try {
      const { data } = await getDonations();
      setDonations(data.donations || []);
    } catch {
    } finally {
      setFetching(false);
    }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("latitude", "26.8467");
      fd.append("longitude", "80.9462");
      await createDonation(fd);
      showMsg("Donation uploaded! AI matching is running…", "success");
      setForm({
        category: "food_cooked",
        title: "",
        description: "",
        quantity: "",
        pickupAddress: "",
      });
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to upload.", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = CATEGORIES.find((c) => c.value === form.category);
  const totalDonated = donations.length;
  const delivered = donations.filter((d) => d.status === "delivered").length;

  return (
    <div style={{ minHeight: "100vh", background: "#FEFAE0" }}>
      <Navbar />

      {/* HERO */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${HERO})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            filter: "brightness(.55)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(27,67,50,.85), rgba(45,106,79,.75))",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 900,
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,.65)",
              textTransform: "uppercase",
              letterSpacing: ".12em",
              marginBottom: 8,
              display: "block",
            }}
          >
            Donor Portal
          </span>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "'Playfair Display', serif",
              lineHeight: 1.2,
              marginBottom: 10,
            }}
          >
            Your generosity,
            <br />
            delivered with care.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,.75)",
              fontStyle: "italic",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            "Every item you share can change a life today."
          </p>
        </div>
      </div>

      {/* STAT CARDS — float over hero */}
      <div
        style={{
          maxWidth: 900,
          margin: "-36px auto 0",
          padding: "0 1.5rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 14,
            marginBottom: "2rem",
          }}
        >
          {[
            {
              icon: "📦",
              label: "Total Donations",
              value: totalDonated,
              color: "#1B4332",
            },
            {
              icon: "✅",
              label: "Delivered",
              value: delivered,
              color: "#2D6A4F",
            },
            {
              icon: "❤️",
              label: "Lives Touched",
              value: delivered * 4 || 0,
              color: "#D4A853",
            },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "1.1rem 1.25rem",
                boxShadow: "0 8px 28px rgba(27,67,50,.1)",
                border: "1px solid #F0EAD6",
                display: "flex",
                alignItems: "center",
                gap: 14,
                animation: `fadeUp .5s ${i * 0.1}s ease both`,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: "#EAF5EE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: s.color,
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: "#9A8F80", marginTop: 1 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
          {[
            { id: "upload", label: "+ Upload Donation" },
            { id: "history", label: `My Donations (${totalDonated})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "9px 22px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 10,
                cursor: "pointer",
                background:
                  tab === t.id
                    ? "linear-gradient(135deg,#1B4332,#2D6A4F)"
                    : "#fff",
                color: tab === t.id ? "#fff" : "#6B6560",
                border: tab === t.id ? "none" : "1.5px solid #E8DDB5",
                boxShadow:
                  tab === t.id ? "0 4px 14px rgba(27,67,50,.25)" : "none",
                transition: "all .2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* MESSAGE */}
        {msg.text && (
          <div
            style={{
              background: msg.type === "success" ? "#D8F3DC" : "#FEE2E2",
              border: `1px solid ${msg.type === "success" ? "#74C69D" : "#FCA5A5"}`,
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              color: msg.type === "success" ? "#1B4332" : "#991B1B",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{msg.type === "success" ? "✅" : "⚠"}</span> {msg.text}
          </div>
        )}

        {/* ── UPLOAD FORM ── */}
        {tab === "upload" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              marginBottom: "2rem",
            }}
          >
            {/* Form card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: "1.75rem",
                boxShadow: "0 4px 24px rgba(27,67,50,.08)",
                border: "1px solid #F0EAD6",
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1B4332",
                  fontFamily: "'Playfair Display',serif",
                  marginBottom: "1.25rem",
                }}
              >
                Donation Details
              </h2>

              {/* Category selector */}
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#1B4332",
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  marginBottom: 10,
                }}
              >
                Category
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  marginBottom: "1.25rem",
                }}
              >
                {CATEGORIES.map((c) => (
                  <div
                    key={c.value}
                    onClick={() => setForm({ ...form, category: c.value })}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "center",
                      border: `2px solid ${form.category === c.value ? c.color : "#E8DDB5"}`,
                      background: form.category === c.value ? c.bg : "#FEFAE0",
                      transition: "all .15s",
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>
                      {c.emoji}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: form.category === c.value ? c.color : "#9A8F80",
                      }}
                    >
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {[
                  {
                    key: "title",
                    label: "Donation Title",
                    placeholder: `e.g. ${selectedCat?.emoji} Fresh ${selectedCat?.label}`,
                  },
                  {
                    key: "quantity",
                    label: "Quantity",
                    placeholder: "e.g. 5kg, 20 portions, 3 bags",
                  },
                  {
                    key: "pickupAddress",
                    label: "Pickup Address",
                    placeholder: "Full address for pickup",
                  },
                ].map((f) => (
                  <div key={f.key} style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#1B4332",
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                        marginBottom: 6,
                      }}
                    >
                      {f.label}
                    </label>
                    <input
                      style={inp}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      required
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                      onFocus={(e) => (e.target.style.borderColor = "#2D6A4F")}
                      onBlur={(e) => (e.target.style.borderColor = "#D4C9A8")}
                    />
                  </div>
                ))}

                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#1B4332",
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                      marginBottom: 6,
                    }}
                  >
                    Notes (Optional)
                  </label>
                  <textarea
                    style={{ ...inp, height: 80, resize: "vertical" }}
                    placeholder="Any special instructions, expiry info…"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
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
                      : "linear-gradient(135deg,#1B4332,#2D6A4F)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 16px rgba(27,67,50,.28)",
                    transition: "all .2s",
                    letterSpacing: ".02em",
                  }}
                >
                  {loading ? "⏳ Uploading…" : "📤 Upload Donation"}
                </button>
              </form>
            </div>

            {/* Right side — tips + impact */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Selected category info */}
              <div
                style={{
                  background: selectedCat?.bg || "#EAF5EE",
                  borderRadius: 20,
                  padding: "1.5rem",
                  border: `1px solid ${selectedCat?.color}30`,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>
                  {selectedCat?.emoji}
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: selectedCat?.color || "#1B4332",
                    fontFamily: "'Playfair Display',serif",
                    marginBottom: 8,
                  }}
                >
                  Donating {selectedCat?.label}
                </h3>
                <p style={{ fontSize: 13, color: "#4A4540", lineHeight: 1.6 }}>
                  {form.category === "food_cooked" &&
                    "Cooked food reaches NGOs within hours. Pack in clean, sealed containers. Mention number of portions."}
                  {form.category === "food_raw" &&
                    "Raw ingredients like rice, dal, atta have long shelf life. Mention weight and packaging date."}
                  {form.category === "clothes" &&
                    "Washed, folded clothes preferred. Mention sizes if known — children's clothes are always in high demand."}
                  {form.category === "medicines" &&
                    "Only donate unexpired medicines. Check expiry date before uploading. Original packaging preferred."}
                  {form.category === "books" &&
                    "Books in good condition. Mention grade level if school books. Donated books go to NGO libraries."}
                  {form.category === "other" &&
                    "Describe clearly what you are donating so we can match with the right NGO."}
                </p>
              </div>

              {/* How it works */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: "1.5rem",
                  border: "1px solid #F0EAD6",
                  boxShadow: "0 4px 16px rgba(27,67,50,.06)",
                }}
              >
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1B4332",
                    fontFamily: "'Playfair Display',serif",
                    marginBottom: 14,
                  }}
                >
                  What happens next?
                </h3>
                {[
                  {
                    icon: "🤖",
                    step: "AI Matching",
                    desc: "Claude AI finds best NGO match in seconds",
                  },
                  {
                    icon: "🚴",
                    step: "Volunteer Assigned",
                    desc: "Nearest trusted volunteer is notified",
                  },
                  {
                    icon: "📍",
                    step: "GPS Tracked",
                    desc: "Real-time tracking until delivery",
                  },
                  {
                    icon: "✅",
                    step: "Confirmed",
                    desc: "Photo + OTP proof of delivery",
                  },
                ].map((s, i) => (
                  <div
                    key={s.step}
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: i < 3 ? 12 : 0,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "#EAF5EE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1B4332",
                        }}
                      >
                        {s.step}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#9A8F80", marginTop: 1 }}
                      >
                        {s.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Motivational quote */}
              <div
                style={{
                  background: "linear-gradient(135deg,#1B4332,#2D6A4F)",
                  borderRadius: 20,
                  padding: "1.5rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: -15,
                    top: -15,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(116,198,157,.15)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 20,
                    bottom: -20,
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "rgba(212,168,83,.15)",
                  }}
                />
                <div
                  style={{
                    fontSize: 32,
                    color: "#D4A853",
                    fontFamily: "'Playfair Display',serif",
                    lineHeight: 1,
                    marginBottom: 8,
                    position: "relative",
                  }}
                >
                  "
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,.9)",
                    lineHeight: 1.6,
                    fontStyle: "italic",
                    position: "relative",
                  }}
                >
                  No act of kindness, no matter how small, is ever wasted.
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(116,198,157,.8)",
                    marginTop: 8,
                    position: "relative",
                  }}
                >
                  — Aesop
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div style={{ marginBottom: "2rem" }}>
            {fetching ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "#9A8F80",
                  fontSize: 14,
                }}
              >
                Loading your donations…
              </div>
            ) : donations.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: "3rem",
                  textAlign: "center",
                  border: "1px solid #F0EAD6",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#1B4332",
                    fontFamily: "'Playfair Display',serif",
                    marginBottom: 8,
                  }}
                >
                  No donations yet
                </h3>
                <p style={{ fontSize: 14, color: "#9A8F80", marginBottom: 16 }}>
                  Upload your first donation and make a difference today!
                </p>
                <button
                  onClick={() => setTab("upload")}
                  style={{
                    padding: "10px 24px",
                    background: "linear-gradient(135deg,#1B4332,#2D6A4F)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Upload Now →
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                {donations.map((d) => {
                  const cat =
                    CATEGORIES.find((c) => c.value === d.category) ||
                    CATEGORIES[5];
                  const st = STATUS[d.status] || {
                    label: d.status,
                    bg: "#F5F4F0",
                    color: "#6B6560",
                  };
                  return (
                    <div
                      key={d._id}
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        padding: "1.25rem",
                        border: "1px solid #F0EAD6",
                        boxShadow: "0 2px 12px rgba(27,67,50,.06)",
                        transition: "all .2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 8px 28px rgba(27,67,50,.12)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 2px 12px rgba(27,67,50,.06)";
                        e.currentTarget.style.transform = "";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: cat.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                          }}
                        >
                          {cat.emoji}
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: st.bg,
                            color: st.color,
                            fontWeight: 600,
                          }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <h4
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1C1C1A",
                          marginBottom: 4,
                        }}
                      >
                        {d.title}
                      </h4>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#9A8F80",
                          marginBottom: 6,
                        }}
                      >
                        {d.quantity}
                      </p>
                      <p style={{ fontSize: 11, color: "#B8B0A6" }}>
                        {new Date(d.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

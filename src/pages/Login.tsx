import { Button, Input } from "antd";
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { CNAME } from "../utils/constants";
import { useNotification } from "../contexts/NotificationContext";
import { core_services } from "../utils/api";
import { useUser } from "../contexts/UserContext";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { BrandMark } from "../components/ui";

/* ---------------- JWT Decode ---------------- */
const decodeJwt = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    const padded = payload + (pad ? "=".repeat(4 - pad) : "");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const HARDCODED_OTP = "202000";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setUserFromToken } = useUser();
  const { showNotification } = useNotification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

  const [step, setStep] = useState<"login" | "otp">("login");
  const [pendingAuth, setPendingAuth] = useState<any>(null);

  /* ---------------- OTP HANDLERS ---------------- */
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    if (e.key === "Enter") void handleVerifyOtp();
  };

  // Paste a full code into any box
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    const next = Array(6).fill("").map((_, i) => digits[i] ?? "");
    setOtp(next);
    document.getElementById(`otp-${Math.min(digits.length, 5)}`)?.focus();
  };

  /* ---------------- LOGIN ---------------- */
  const [handleLogin, loading] = useAsyncAction(async () => {
    if (!email || !password) {
      showNotification("Error", "Please provide email and password", "warning", 3000);
      return;
    }

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showNotification("Error", "Invalid email address", "error", 3000);
      return;
    }

    try {
      const data = await core_services.loginUser({ email, password });
      const token = data?.token || data?.accessToken;
      if (!token) throw new Error("No token received");

      const payload = decodeJwt(token);

      const user = {
        id: payload?.id || payload?.userId,
        name: payload?.name || payload?.username,
        email: payload?.email || email,
        role: payload?.role || "admin",
      };

      const expiresIn =
        payload?.exp && payload?.iat ? payload.exp - payload.iat : 0;

      setPendingAuth({ token, user, expiresIn });
      setOtp(Array(6).fill(""));
      setStep("otp");

      showNotification("OTP Sent", "Enter OTP to continue", "success", 2000);
    } catch (err: any) {
      // loginUser rethrows the server body (or a message string)
      showNotification(
        "Error",
        err?.message || err?.response?.data?.message || (typeof err === "string" ? err : "Login failed"),
        "error",
        3000
      );
    }
  });

  /* ---------------- VERIFY OTP ---------------- */
  const [handleVerifyOtp, verifying] = useAsyncAction(async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length < 6) {
      showNotification("Error", "Enter complete OTP", "warning", 3000);
      return;
    }

    if (enteredOtp !== HARDCODED_OTP) {
      showNotification("Invalid OTP", "Try again", "error", 3000);
      return;
    }

    login(pendingAuth);
    await setUserFromToken(pendingAuth.token);
    showNotification("Success", "Login successful", "success", 2000);
    navigate("/insights");
  });

  return (
    <div className="login-scope">
      <style>{`
        .login-scope { min-height: 100vh; display: grid; grid-template-columns: 1fr; padding: 18px; gap: 18px; }
        @media (min-width: 1024px) { .login-scope { grid-template-columns: 1.05fr 1fr; } }
        .login-brand {
          position: relative; overflow: hidden; border-radius: 32px; padding: 44px;
          display: none; flex-direction: column; justify-content: space-between; color: #fff;
          background:
            radial-gradient(60% 50% at 85% 10%, rgba(127,155,240,.45), transparent 70%),
            radial-gradient(70% 60% at 0% 100%, rgba(53,89,199,.55), transparent 70%),
            linear-gradient(150deg, #202A40 0%, #1a2236 100%);
          box-shadow: 0 40px 80px -40px rgba(32,42,64,.6);
        }
        @media (min-width: 1024px) { .login-brand { display: flex; } .login-mobile-brand { display: none !important; } }
        .login-brand h2 { font-size: clamp(30px, 3.2vw, 44px); line-height: 1.08; font-weight: 700; letter-spacing: -.03em; margin: 0 0 14px; }
        .login-brand p { color: #c0c7d4; font-size: 15px; max-width: 420px; margin: 0; }
        .login-orb { position: absolute; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); }
        .login-feature { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 28px; }
        .login-feature span {
          font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 999px;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); color: #eef2fc;
        }
        .login-side { display: grid; place-items: center; padding: 24px 0; }
        .login-card {
          width: 100%; max-width: 420px; padding: 36px 32px; border-radius: 32px;
          background: rgba(255,255,255,.82); border: 1px solid #fff;
          -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
          box-shadow: 0 40px 80px -40px rgba(32,42,64,.35);
          animation: cms-rise .5s var(--wy-ease) both;
        }
        .login-card h1 { font-size: 28px; font-weight: 700; color: var(--wy-navy); letter-spacing: -.02em; margin: 0 0 6px; }
        .login-card .sub { color: var(--wy-text-2); font-size: 13px; margin: 0 0 28px; }
        .login-label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: var(--wy-text-2); margin: 0 0 8px 4px; }
        .login-link { font-size: 12px; font-weight: 600; color: var(--wy-primary); cursor: pointer; background: none; border: 0; padding: 0; font-family: inherit; }
        .login-link:hover { color: var(--wy-primary-hover); }
        .login-card .ant-input-affix-wrapper { border-radius: 999px !important; padding-inline: 18px; height: 50px; }
        .login-card .ant-input-prefix { color: var(--wy-muted); margin-inline-end: 10px; }
        .login-otp { display: flex; justify-content: center; gap: 10px; margin-bottom: 26px; }
        .login-otp input {
          width: 48px; height: 56px; text-align: center; font-size: 22px; font-weight: 700; color: var(--wy-navy);
          border-radius: 16px; border: 1px solid var(--wy-border); background: #fbfcfe; outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s; font-family: inherit;
        }
        .login-otp input:focus { border-color: var(--wy-primary); background: #fff; box-shadow: 0 0 0 4px rgba(53,89,199,.14); }
        @media (max-width: 400px) {
          .login-otp { gap: 6px; }
          .login-otp input { width: 40px; height: 50px; font-size: 19px; }
          .login-card { padding: 28px 20px; }
        }
      `}</style>

      {/* ── Brand panel (desktop) ── */}
      <aside className="login-brand" aria-hidden="true">
        <span className="login-orb" style={{ width: 520, height: 520, right: -180, top: -160 }} />
        <span className="login-orb" style={{ width: 340, height: 340, right: -90, top: -70 }} />
        <span className="login-orb" style={{ width: 600, height: 600, left: -300, bottom: -360 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <BrandMark size={56} style={{ border: "1px solid rgba(255,255,255,0.18)" }} />
          <b style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
            nearwe<span style={{ fontWeight: 500, color: "#c0c7d4" }}>cms</span>
          </b>
        </div>

        <div style={{ position: "relative" }}>
          <h2>
            Run your community
            <br />
            from one calm place.
          </h2>
          <p>Users, events, categories, announcements and reports, managed from one admin workspace.</p>
          <div className="login-feature">
            <span>Insights</span>
            <span>Events</span>
            <span>Announcements</span>
            <span>Reports</span>
          </div>
        </div>

        <p style={{ position: "relative", fontSize: 12 }}>
          © {CNAME} {new Date().getFullYear()}
        </p>
      </aside>

      {/* ── Form side ── */}
      <div className="login-side">
        <div className="login-card" key={step}>
          {step === "login" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleLogin();
              }}
              noValidate
            >
              <div className="login-mobile-brand" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
                <BrandMark size={42} />
                <b style={{ fontSize: 18, fontWeight: 800, color: "var(--wy-navy)" }}>
                  nearwe<span style={{ fontWeight: 500, color: "var(--wy-text-2)" }}>cms</span>
                </b>
              </div>

              <h1>CMS Login</h1>
              <p className="sub">Welcome back! Please enter your credentials.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label className="login-label" htmlFor="login-email">
                    Admin Email
                  </label>
                  <Input
                    id="login-email"
                    size="large"
                    prefix={<MailOutlined />}
                    placeholder="admin@nearwe.com"
                    autoComplete="email"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <div className="login-label">
                    <label htmlFor="login-password">Password</label>
                    <span className="login-link">Forgot password?</span>
                  </div>
                  <Input.Password
                    id="login-password"
                    size="large"
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  style={{ height: 50, marginTop: 6 }}
                >
                  {loading ? "Signing in…" : <>Login <ArrowRightOutlined /></>}
                </Button>
              </div>

              <p className="lg:hidden" style={{ textAlign: "center", fontSize: 12, color: "var(--wy-muted)", margin: "26px 0 0" }}>
                © {CNAME} {new Date().getFullYear()}
              </p>
            </form>
          )}

          {step === "otp" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("login");
                  setOtp(Array(6).fill(""));
                }}
                className="login-link"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 22 }}
              >
                <ArrowLeftOutlined /> Back to Login
              </button>

              <div>
                <span
                  className="cms-icon-tile"
                  style={{ width: 56, height: 56, borderRadius: 18, fontSize: 22, marginBottom: 18 }}
                >
                  <SafetyCertificateOutlined />
                </span>
              </div>
              <h1>Verify OTP</h1>
              <p className="sub">
                We've sent a 6-digit code to <b style={{ color: "var(--wy-navy)" }}>{email}</b>
              </p>

              <div className="login-otp" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${index + 1}`}
                    maxLength={1}
                    autoFocus={index === 0}
                    value={digit}
                    disabled={verifying}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  />
                ))}
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={verifying}
                onClick={() => void handleVerifyOtp()}
                style={{ height: 50 }}
              >
                Verify & Continue <ArrowRightOutlined />
              </Button>

              <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--wy-text-2)" }}>
                Didn't receive the code?
                <span className="login-link" style={{ marginLeft: 6 }}>
                  Resend (30s)
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

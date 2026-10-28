import { Button, Input } from "antd";
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/Loader";
import { useState } from "react";
import { CNAME } from "../utils/constants";
import { useNotification } from "../contexts/NotificationContext";
import { core_services } from "../utils/api";
import { useUser } from "../contexts/UserContext";

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

  const [loading, setLoading] = useState(false);
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
    if (e.key === "Enter") handleVerifyOtp();
  };

  /* ---------------- LOGIN ---------------- */
  const handleLogin = async () => {
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

    setLoading(true);
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
      setStep("otp");

      showNotification("OTP Sent", "Enter OTP to continue", "success", 2000);
    } catch (err: any) {
      showNotification(
        "Error",
        err?.response?.data?.message || "Login failed",
        "error",
        3000
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const handleVerifyOtp = () => {
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
    setUserFromToken(pendingAuth.token);
    showNotification("Success", "Login successful", "success", 2000);
    navigate("/insights")
  };

  return (
    <div className="login-scope min-h-screen bg-[#050B1E] flex items-center justify-center relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <Loader />
        </div>
      )}

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#0a162e] rounded-3xl shadow-2xl border border-white/5 p-8 md:p-10 backdrop-blur-sm">

        {/* ---------------- LOGIN SCREEN ---------------- */}
        {step === "login" && (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-white mb-2">CMS Login</h1>
              <p className="text-sm text-gray-400">
                Welcome back! Please enter your credentials.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-300 ml-1">
                  Admin Email
                </label>
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="admin@nearwe.com"
                  className="mt-2 rounded-xl bg-[#121e3a] border border-gray-700 text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-300 ml-1">
                    Password
                  </label>
                  <span className="text-xs text-sky-400 cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder="••••••••"
                  className="mt-2 rounded-xl bg-[#121e3a] border border-gray-700 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                onClick={handleLogin}
                className="w-full py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-medium shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2"
              >
                Login <ArrowRightOutlined />
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-gray-500">
                © {CNAME} {new Date().getFullYear()}
              </p>
            </div>
          </>
        )}

        {/* ---------------- OTP SCREEN ---------------- */}
        {step === "otp" && (
          <>
            <button
              onClick={() => setStep("login")}
              className="text-sm text-gray-400 flex items-center gap-1 mb-6 hover:text-sky-400"
            >
              ← Back to Login
            </button>

            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#121e3a] flex items-center justify-center">
                <LockOutlined className="text-2xl text-sky-400" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-3">Verify OTP</h1>
              <p className="text-sm text-gray-400">
                We've sent a 6-digit code to <br />
                <span className="text-gray-200 font-medium">{email}</span>
              </p>
            </div>

            <div className="flex justify-center gap-3 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-[#121e3a] border border-gray-700 text-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 outline-none"
                />
              ))}
            </div>

            <Button
              onClick={handleVerifyOtp}
              className="w-full py-3 rounded-full bg-sky-400 hover:bg-sky-300 text-white font-semibold shadow-lg shadow-sky-400/30 flex items-center justify-center gap-2"
            >
              Verify & Continue <ArrowRightOutlined />
            </Button>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-400">
                Didn't receive the code?
                <span className="ml-1 text-sky-400 cursor-pointer">
                  Resend (30s)
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;

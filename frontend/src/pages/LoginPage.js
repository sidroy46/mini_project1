import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function getLoginErrorMessage(exception) {
  const status = exception?.response?.status;
  const backendMessage = exception?.response?.data?.message;

  if (typeof backendMessage === "string" && backendMessage.trim()) {
    return backendMessage;
  }

  if (status === 401) {
    return "Invalid username or password";
  }

  if (status >= 500) {
    return "Server error. Please try again in a moment.";
  }

  if (exception?.code === "ERR_NETWORK") {
    return "Cannot reach server. Check backend connection and try again.";
  }

  return "Login failed";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/login", { username, password });
      login(response.data);
      navigate("/dashboard");
    } catch (exception) {
      setError(getLoginErrorMessage(exception));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-8">
      <form
        className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/70 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.6)] backdrop-blur-xl"
        onSubmit={handleSubmit}
      >
        <p className="mb-2 inline-block rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-200">
          Smart Face Attendance
        </p>
        <h1 className="app-title">College Attendance Login</h1>
        <p className="app-subtitle mt-2">Use admin/faculty credentials to continue</p>

        <label className="mt-6 mb-2 block text-sm font-medium text-slate-300">Username</label>
        <input
          className="app-input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <label className="mt-4 mb-2 block text-sm font-medium text-slate-300">Password</label>
        <input
          className="app-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && (
          <p className="app-alert-error mt-4">
            {error}
          </p>
        )}

        <button
          className="app-btn-primary mt-6 w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

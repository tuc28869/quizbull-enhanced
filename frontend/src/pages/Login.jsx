// frontend/src/pages/Login.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Link } from "react-router-dom";
import { login } from "../app/slices/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const { token, status, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ email: "", password: "" });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    dispatch(login(form));
  }

  /* already logged in? -> go home */
  if (token) return <Navigate to="/" replace />;

  return (
    <section style={{ maxWidth: 320, margin: "60px auto" }}>
      <h2>Log in</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label style={{ marginTop: 12, display: "block" }}>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </label>

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <p style={{ marginTop: 16 }}>
        Need an account? <Link to="/signup">Create one</Link>
      </p>
    </section>
  );
}
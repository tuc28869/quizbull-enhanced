// frontend/src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      await api.post("/auth/signup", form);
      setStatus("success");
      /* go straight to login page */
      navigate("/login", { replace: true });
    } catch (err) {
      setStatus("error");
      setError(err.response?.data?.message || "Signup failed");
    }
  }

  return (
    <section style={{ maxWidth: 320, margin: "60px auto" }}>
      <h2>Create account</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
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
          {status === "loading" ? "Creating…" : "Sign up"}
        </button>
      </form>

      {status === "success" && (
        <p style={{ color: "green" }}>Account created! Please log in.</p>
      )}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
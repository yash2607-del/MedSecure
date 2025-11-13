import React, { useState } from "react";
import { api } from "../lib/api";
import { Form, Button, Spinner } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  await api.post("/auth/register", { username, email, password });
      toast.success("Registered successfully. Please login.");
      setTimeout(() => nav("/login"), 800);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-welcome-panel">
        <div className="auth-welcome-content">
          <h1>Welcome, Doctor</h1>
          <p>Streamlined and secure care</p>
          <ul className="feature-list">
            <li>Encrypt patient data before sending</li>
            <li>Deliver securely to another doctor</li>
            <li>Audit every action for traceability</li>
          </ul>
        </div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-content">
          <h3>Doctor Signup</h3>
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>EMAIL</Form.Label>
              <Form.Control 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>USERNAME</Form.Label>
              <Form.Control 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>PASSWORD</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={loading}
              />
            </Form.Group>
            <Button type="submit" className="w-100" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "Register"}
            </Button>
            <div className="auth-mode-toggle">
              <p className="text-muted mb-0">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Register;


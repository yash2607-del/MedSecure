import React, { useState } from "react";
import { api } from "../lib/api";
import { Form, Button, Spinner } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  await api.post("/auth/login", { username, password });
      toast.success("Logged in successfully");
      setTimeout(() => nav("/dashboard"), 500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-welcome-panel">
        <div className="auth-welcome-content">
          <h1>Welcome, Doctor</h1>
          <p>Secure steganography-based patient data exchange</p>
          <ul>
            <li>Hide patient info in images and audio files</li>
            <li>Send encrypted data to colleague doctors</li>
            <li>Track all activities with complete audit logs</li>
          </ul>
        </div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-content">
          <h3>Doctor Login</h3>
          <Form onSubmit={submit}>
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
              {loading ? <Spinner animation="border" size="sm" /> : "Login"}
            </Button>
            <div className="auth-mode-toggle">
              <p className="text-muted mb-0">
                Don't have an account? <Link to="/register">Sign Up</Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;


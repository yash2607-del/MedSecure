import React from "react";
import { Container, Button, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Activity, FileText, MessageSquare, CheckCircle } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-section">
        <Container>
          <div className="hero-content text-center">
            <div className="mb-4">
              <span className="badge-pill">Steganography-Enabled</span>
              <span className="badge-pill">Encrypted</span>
              <span className="badge-pill">Secure</span>
            </div>
            <h1 className="hero-title">MedSecure</h1>
            <p className="hero-subtitle">Steganography-Powered Medical Data Exchange</p>
            <p className="hero-description">
              A secure platform enabling <span className="highlight">doctors</span> to exchange sensitive 
              patient information through steganography and cryptography. Hide encrypted patient data 
              within images and audio files, ensuring complete confidentiality within your hospital network.
            </p>
            <div className="hero-buttons">
              <Button size="lg" className="btn-primary-custom me-3" onClick={() => navigate("/login")}>
                Get Started
              </Button>
              <Button size="lg" variant="outline-light" onClick={() => navigate("/register")}>
                Sign Up
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <Container>
          <h2 className="section-title text-center mb-5">Core Features</h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <Shield size={40} />
                  </div>
                  <h5 className="feature-title">Steganography-Powered Security</h5>
                  <p className="feature-text">
                    Hide encrypted patient records (ID, name, messages) within PNG, JPEG, or WAV files using LSB steganography.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <MessageSquare size={40} />
                  </div>
                  <h5 className="feature-title">Real-Time Doctor-to-Doctor Messaging</h5>
                  <p className="feature-text">
                    Send encrypted patient data directly to colleague doctors with instant WebSocket notifications.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <Lock size={40} />
                  </div>
                  <h5 className="feature-title">End-to-End Encryption</h5>
                  <p className="feature-text">
                    Patient data is encrypted with Fernet before embedding, ensuring only authorized recipients can decrypt.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <Activity size={40} />
                  </div>
                  <h5 className="feature-title">Multi-Format Support</h5>
                  <p className="feature-text">
                    Embed secret patient data in image formats (PNG, JPEG) or audio files (WAV) with robust LSB techniques.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <FileText size={40} />
                  </div>
                  <h5 className="feature-title">Complete Audit Logs</h5>
                  <p className="feature-text">
                    Track all encryption, transmission, and decryption activities for compliance and security audits.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <CheckCircle size={40} />
                  </div>
                  <h5 className="feature-title">Message Status Tracking</h5>
                  <p className="feature-text">
                    Inbox displays message status (new/decrypted) so doctors know exactly what's been accessed.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Footer */}
      <div className="footer-section">
        <Container>
          <p className="text-center mb-0">© 2025 MedSecure. Secure steganography-based patient data exchange for healthcare professionals.</p>
        </Container>
      </div>
    </div>
  );
};

export default Landing;

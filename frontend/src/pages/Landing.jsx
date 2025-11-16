import React from "react";
import { Container, Button, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Activity, FileText, Eye, CheckCircle, Key, Database, Users, Zap } from "lucide-react";

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
            <p className="hero-subtitle">Advanced Steganography-Powered Medical Data Exchange</p>
            <p className="hero-description">
              A cutting-edge secure platform enabling <span className="highlight">healthcare professionals</span> to exchange sensitive 
              patient information through advanced steganography and multi-layer cryptography. Hide encrypted patient data 
              within PNG images and WAV audio files using LSB steganography, ensuring complete confidentiality and compliance.
            </p>
            <div className="hero-buttons">
             <Button size="lg" variant="outline-light me-3" onClick={() => navigate("/login")}>
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
                  <h5 className="feature-title">LSB Steganography</h5>
                  <p className="feature-text">
                    Hide encrypted patient records within PNG images and WAV audio files using advanced Least Significant Bit techniques.
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
                  <h5 className="feature-title">Fernet Encryption</h5>
                  <p className="feature-text">
                    Patient data is encrypted with AES-128 Fernet encryption before embedding, ensuring only authorized recipients can decrypt.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <Key size={40} />
                  </div>
                  <h5 className="feature-title">Vigenère Cipher</h5>
                  <p className="feature-text">
                    Enhanced polyalphabetic cipher for message display logs, providing an additional security layer for sensitive text.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <Users size={40} />
                  </div>
                  <h5 className="feature-title">Doctor-to-Doctor Messaging</h5>
                  <p className="feature-text">
                    Send encrypted patient data directly to colleague doctors with secure recipient email/username targeting.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mx-auto mb-3">
                    <Database size={40} />
                  </div>
                  <h5 className="feature-title">MongoDB Audit Logs</h5>
                  <p className="feature-text">
                    Complete audit trail of all encryption, send, and decrypt activities stored securely for compliance and forensics.
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
                  <h5 className="feature-title">JWT Authentication</h5>
                  <p className="feature-text">
                    Secure session management with JSON Web Tokens, ensuring authenticated access to patient data exchange.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* How It Works Section */}
      <div className="how-it-works-section py-5" style={{background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)', color: 'white'}}>
        <Container>
          <h2 className="section-title text-center mb-5 text-white">How It Works</h2>
          <Row className="g-4">
            <Col md={3}>
              <div className="text-center">
                <div className="step-number mx-auto mb-3" style={{width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold'}}>1</div>
                <h5 className="text-white">Upload & Encrypt</h5>
                <p className="text-white">Select a PNG/WAV cover file and enter patient data. Data is encrypted with Fernet and Vigenère cipher.</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <div className="step-number mx-auto mb-3" style={{width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold'}}>2</div>
                <h5 className="text-white">Embed with LSB</h5>
                <p className="text-white">Encrypted payload is hidden within the cover file using LSB steganography, creating a stego file.</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <div className="step-number mx-auto mb-3" style={{width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold'}}>3</div>
                <h5 className="text-white">Send Securely</h5>
                <p className="text-white">Stego file is sent to recipient doctor's inbox. Original file is also preserved for reference.</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <div className="step-number mx-auto mb-3" style={{width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold'}}>4</div>
                <h5 className="text-white">Extract & Decrypt</h5>
                <p className="text-white">Recipient uploads stego file to extract and decrypt patient data using the shared Fernet key.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Footer */}
      <div className="footer-section" style={{background: '#1a1a2e', color: '#fff', padding: '2rem 0'}}>
        <Container>
          <div className="text-center">
            <h5 className="mb-2" style={{color: '#00b4d8'}}>MedSecure</h5>
            <p className="text-white-50 small mb-3">
              Secure steganography-based patient data exchange for healthcare professionals.
            </p>
            <p className="text-center text-white-50 small mb-0">© 2025 MedSecure. All rights reserved.</p>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Landing;

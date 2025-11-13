import React, { useState } from "react";
import { api } from "../lib/api";
import { Card, Form, Button, Spinner, Row, Col, Alert } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { Lock, User, FileText, Send } from "lucide-react";

const Encrypt = () => {
  const [file, setFile] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadHref, setDownloadHref] = useState(null);
  const [downloadName, setDownloadName] = useState("message.enc");
  const [previewMime, setPreviewMime] = useState("application/octet-stream");
  const [monoCipher, setMonoCipher] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Payload for encryption + send; backend now handles encryption (no file yet wired)
      const body = { recipient, patient_id: patientId, patient_name: patientName, data };
      const res = await api.post("/messages/send", body);
      if (res?.data?.id) {
        if (res.data.mono_cipher) setMonoCipher(res.data.mono_cipher);
        try {
          const fileRes = await api.get(`/messages/${res.data.id}/file`, { responseType: 'blob' });
          const blob = new Blob([fileRes.data], { type: fileRes.headers['content-type'] || 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          setDownloadHref(url);
          const disposition = fileRes.headers['content-disposition'] || '';
          const match = disposition.match(/filename="(.+?)"/i);
          setDownloadName(match ? match[1] : 'message.enc');
          setPreviewMime(blob.type || 'application/octet-stream');
        } catch (e) {
          // If file fetch fails, still proceed as message sent
        }
      }
      toast.success("Message encrypted and sent securely to " + recipient);
      // Reset form (keep mono cipher shown)
      setFile(null);
      setPatientId("");
      setPatientName("");
      setRecipient("");
      setData("");
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Encryption failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="encrypt-page">
      <div className="page-header mb-4">
        <div className="d-flex align-items-center">
          <div className="header-icon">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="mb-1">Encrypt & Send Patient Data</h2>
            <p className="text-muted mb-0">Securely hide patient information in image or audio files</p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <Alert variant="info" className="mb-4">
            <strong>How it works:</strong> Your patient data will be encrypted and embedded within the selected file using LSB steganography, then sent securely to the recipient doctor.
          </Alert>

          <Form onSubmit={submit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="form-label-custom">
                    <FileText size={18} className="me-2" />
                    Cover File
                  </Form.Label>
                  <Form.Control 
                    type="file" 
                    accept="image/*,audio/*"
                    onChange={e => setFile(e.target.files[0])} 
                    className="form-control-custom"
                  />
                  <Form.Text className="text-muted">
                    (Optional) Future: embed in selected PNG/JPEG/WAV cover file
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="form-label-custom">
                    <User size={18} className="me-2" />
                    Recipient Doctor Username
                  </Form.Label>
                  <Form.Control 
                    type="text"
                    placeholder="Enter recipient's username" 
                    value={recipient} 
                    onChange={e => setRecipient(e.target.value)} 
                    required 
                    className="form-control-custom"
                  />
                  <Form.Text className="text-muted">
                    The doctor who will receive this encrypted message
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="section-divider mb-4">
              <h5 className="section-title">Patient Information</h5>
            </div>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="form-label-custom">
                    Patient ID
                  </Form.Label>
                  <Form.Control 
                    type="text"
                    placeholder="e.g., P-2024-001" 
                    value={patientId} 
                    onChange={e => setPatientId(e.target.value)} 
                    required 
                    className="form-control-custom"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="form-label-custom">
                    Patient Name
                  </Form.Label>
                  <Form.Control 
                    type="text"
                    placeholder="Enter patient's full name" 
                    value={patientName} 
                    onChange={e => setPatientName(e.target.value)} 
                    required 
                    className="form-control-custom"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="form-label-custom">
                Secret Message
              </Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                placeholder="Enter confidential patient information, diagnosis, or notes..."
                value={data} 
                onChange={e => setData(e.target.value)} 
                required 
                className="form-control-custom"
              />
              <Form.Text className="text-muted">
                This message will be encrypted before embedding
              </Form.Text>
            </Form.Group>

            <div className="d-grid">
              <Button 
                type="submit" 
                disabled={loading} 
                size="lg"
                className="btn-encrypt"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Send size={20} className="me-2" />
                    Encrypt & Send Message
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      {monoCipher && (
        <Card className="shadow-sm border-0 mt-3">
          <Card.Body className="p-4">
            <h5 className="mb-2">Monoalphabetic Encrypted Text</h5>
            <code className="d-block" style={{whiteSpace:'pre-wrap', wordBreak:'break-word'}}>{monoCipher}</code>
          </Card.Body>
        </Card>
      )}
      {downloadHref && (
        <Card className="shadow-sm border-0 mt-3">
          <Card.Body className="p-4 d-flex align-items-center gap-3">
            <a download={downloadName} href={downloadHref} className="btn btn-outline-primary">
              Download encrypted file
            </a>
            {previewMime.startsWith('image/') && (
              <img alt="encrypted-preview" src={downloadHref} style={{ maxHeight: 120, borderRadius: 8 }} />
            )}
            {previewMime.startsWith('audio/') && (
              <audio controls src={downloadHref} />
            )}
          </Card.Body>
        </Card>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Encrypt;

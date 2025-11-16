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
  const [downloadName, setDownloadName] = useState(null);
  const [previewMime, setPreviewMime] = useState(null);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        resolve(btoa(binary));
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = {
        recipient,
        patient_id: patientId,
        patient_name: patientName,
        data,
      };

      if (file) {
        const b64 = await fileToBase64(file);
        const mime = file.type || "application/octet-stream";
        body.file = { b64, mime, filename: file.name };
      }

      const res = await api.post("/messages/send", body);

      toast.success("Message encrypted successfully!");

      const stego = res.data?.stego_file;
      if (stego) {
        // Prepare download blob from base64
        const byteChars = atob(stego.b64);
        const byteArray = Uint8Array.from(byteChars, (c) =>
          c.charCodeAt(0)
        );
        const blob = new Blob([byteArray], { type: stego.mime });

        const url = URL.createObjectURL(blob);
        setDownloadHref(url);
        setDownloadName(stego.filename);
        setPreviewMime(stego.mime);
      } 

      // Reset form
      setFile(null);
      setPatientId("");
      setPatientName("");
      setRecipient("");
      setData("");
      e.target.reset();

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Encryption failed");
    }

    setLoading(false);
  };

  return (
    <div className="encrypt-page">
      <div className="page-header mb-4 d-flex align-items-center">
        <Lock size={32} className="me-3" />
        <div>
          <h2 className="mb-1">Encrypt & Send Patient Data</h2>
          <p className="text-muted mb-0">
            Securely hide patient information in image or audio files
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">


          <Form onSubmit={submit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    <FileText size={18} className="me-2" />
                    Cover File
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, audio/wav"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <Form.Text className="text-muted">
                    PNG / WAV supported
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    <User size={18} className="me-2" />
                    Recipient Doctor Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="doctor@gmail.com"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>Patient ID</Form.Label>
                  <Form.Control
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>Patient Name</Form.Label>
                  <Form.Control
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>Secret Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                placeholder="Confidential medical notes..."
              />
            </Form.Group>

            <div className="d-grid">
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Send size={20} className="me-2" />
                    Encrypt & Send Securely
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {downloadHref && (
        <Card className="shadow-sm border-0 mt-3 p-3">
          <h5 className="mb-3">Download Steganographic File</h5>
          <a
            download={downloadName}
            href={downloadHref}
            className="btn btn-outline-primary"
          >
            Download {downloadName}
          </a>

          {previewMime?.startsWith("image/") && (
            <img
              src={downloadHref}
              alt="preview"
              className="mt-3"
              style={{ maxWidth: 200, borderRadius: 8 }}
            />
          )}

          {previewMime?.startsWith("audio/") && (
            <audio controls src={downloadHref} className="mt-3" />
          )}
        </Card>
      )}

      <ToastContainer position="top-right" autoClose={2500} />
    </div>
  );
};

export default Encrypt;

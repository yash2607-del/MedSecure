import React, { useState } from "react";
import axios from "axios";
import { Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import { Unlock, FileSearch, Upload } from "lucide-react";
import PayloadModal from "../components/PayloadModal";

const Decrypt = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [open, setOpen] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile?.name || "");
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Placeholder: future direct file decode endpoint. For now user should decrypt via inbox.
      toast.info('Direct file decryption not yet wired to backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="decrypt-page">
      <div className="page-header mb-4">
        <div className="d-flex align-items-center">
          <div className="header-icon">
            <Unlock size={32} />
          </div>
          <div>
            <h2 className="mb-1">Retrieve & Decrypt Patient Data</h2>
            <p className="text-muted mb-0">Extract hidden patient information from steganographic files</p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <Alert variant="info" className="mb-4">
            <strong>How it works:</strong> Upload a steganographic file to extract and decrypt the hidden patient data using LSB steganography and Fernet decryption.
          </Alert>

          <Form onSubmit={submit}>
            <div className="upload-area mb-4">
              <Form.Group>
                <Form.Label className="form-label-custom">
                  <FileSearch size={18} className="me-2" />
                  Select Steganographic File (future feature)
                </Form.Label>
                
                <div className="file-upload-wrapper">
                  <Form.Control 
                    type="file" 
                    accept="image/*,audio/*"
                    onChange={handleFileChange}
                    required 
                    className="form-control-custom file-input"
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" className="file-upload-label">
                    <div className="file-upload-content">
                      <Upload size={40} className="upload-icon mb-3" />
                      {fileName ? (
                        <>
                          <p className="mb-1 fw-bold text-primary">{fileName}</p>
                          <p className="text-muted small">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <p className="mb-1 fw-bold">Click to upload or drag and drop</p>
                          <p className="text-muted small">PNG, JPEG, JPG, or WAV files</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                
                <Form.Text className="text-muted">
                  Upcoming: decode embedded payload locally or via Python service
                </Form.Text>
              </Form.Group>
            </div>

            <div className="d-grid">
              <Button 
                type="submit" 
                disabled={loading || !file} 
                size="lg"
                className="btn-decrypt"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Unlock size={20} className="me-2" />
                    Retrieve & Decrypt Data
                  </>
                )}
              </Button>
            </div>
          </Form>

          {payload && (
            <Alert variant="success" className="mt-4">
              <strong>Success!</strong> Patient data has been decrypted. View details in the popup window.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <PayloadModal show={open} onHide={() => setOpen(false)} data={payload} />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Decrypt;

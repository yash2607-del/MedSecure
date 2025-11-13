import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, Table, Button, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { Inbox as InboxIcon, Mail, MailOpen, RefreshCw, ExternalLink, Unlock } from "lucide-react";
import PayloadModal from "../components/PayloadModal";

const Inbox = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInbox = async () => {
    setLoading(true);
    try {
  const res = await api.get("/messages/inbox?mine=true");
      setItems(res.data.items || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to fetch inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleDecrypt = async (messageId) => {
    try {
      const res = await api.post("/messages/decrypt/" + messageId);
      setPayload(res.data.payload);
      setOpen(true);
      toast.success("Message decrypted successfully!");
      fetchInbox();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to decrypt");
    }
  };

  const newMessages = items.filter(m => !m.decrypted).length;

  return (
    <div className="inbox-page">
      <div className="page-header mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="header-icon">
              <InboxIcon size={32} />
            </div>
            <div>
              <h2 className="mb-1">Message Inbox</h2>
              <p className="text-muted mb-0">
                Encrypted patient data messages from colleague doctors
              </p>
            </div>
          </div>
          <Button 
            variant="outline-primary" 
            onClick={fetchInbox}
            disabled={loading}
            className="d-flex align-items-center"
          >
            <RefreshCw size={18} className="me-2" />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {newMessages > 0 && (
        <Alert variant="info" className="mb-4">
          <strong>You have {newMessages} new message{newMessages > 1 ? 's' : ''}!</strong> Click decrypt to view the patient data.
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-5">
              <Mail size={64} className="text-muted mb-3" />
              <h5 className="text-muted">No messages yet</h5>
              <p className="text-muted">Encrypted messages from other doctors will appear here</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 inbox-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>From Doctor</th>
                    <th>Patient ID</th>
                    <th>Encrypted Text</th>
                    <th>Encrypted File</th>
                    <th>Received</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m._id} className={!m.decrypted ? "unread-message" : ""}>
                      <td>
                        {m.decrypted ? (
                          <MailOpen size={20} className="text-muted" />
                        ) : (
                          <Mail size={20} className="text-primary" />
                        )}
                      </td>
                      <td>
                        <strong>{m.senderUsername || m.sender}</strong>
                      </td>
                      <td>
                        <code className="patient-id-badge">{m.patient_id || "-"}</code>
                      </td>
                      <td>
                        <code className="text-muted small">{(m.cipher_text || '').slice(0, 40)}{(m.cipher_text || '').length>40?'…':''}</code>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary" onClick={async ()=>{
                          try {
                            const fileRes = await api.get(`/messages/${m._id}/file`, { responseType: 'blob' });
                            const blob = new Blob([fileRes.data], { type: fileRes.headers['content-type'] || 'application/octet-stream' });
                            const url = URL.createObjectURL(blob);
                            const disposition = fileRes.headers['content-disposition'] || '';
                            const match = disposition.match(/filename="(.+?)"/i);
                            const name = match ? match[1] : 'message.enc';
                            const a = document.createElement('a');
                            a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
                            setTimeout(()=> URL.revokeObjectURL(url), 1500);
                          } catch (e) {
                            toast.error('No encrypted file available');
                          }
                        }}>
                          <ExternalLink size={16} className="me-1" /> Download
                        </Button>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(m.createdAt || m.created_at).toLocaleString()}
                        </small>
                      </td>
                      <td className="text-end">
                        <Button 
                          size="sm" 
                          variant={m.decrypted ? "outline-secondary" : "primary"}
                          onClick={() => handleDecrypt(m._id)}
                          className="decrypt-btn"
                        >
                          <Unlock size={16} className="me-1" />
                          {m.decrypted ? "View Again" : "Decrypt"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <PayloadModal show={open} onHide={() => setOpen(false)} data={payload} />
    </div>
  );
};

export default Inbox;

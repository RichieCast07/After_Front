import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../../../Shared/Presentation/Components/dashboard-shell.css";
import { formatDateTime } from "../../../../Core/Utils/date";
import { eventsUseCase } from "../../../Events/Domain/EventsUseCase";
import type { TicketDTO } from "../../Data/Models/Ticket";
import { ticketsUseCase } from "../../Domain/TicketsUseCase";

function getQrContent(ticket: TicketDTO) {
  if (ticket.qr_payload?.trim()) {
    return ticket.qr_payload;
  }

  return JSON.stringify({
    codigo: ticket.codigo,
    nombre: ticket.cliente_nombre ?? "",
    telefono: ticket.cliente_telefono ?? "",
    rp_id: ticket.rp_id,
    rp_nombre: ticket.rp_nombre ?? "",
    codigo_evento: ticket.codigo_evento ?? "",
    tipo_boleto: ticket.tipo_boleto ?? "GENERAL",
    estado: ticket.estado,
  });
}

export default function PublicTicketPage() {
  const { token } = useParams();
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  useEffect(() => {
    const loadTicket = async () => {
      if (!token) {
        setError("Token inválido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await ticketsUseCase.getPublicTicketByToken(token);
        setTicket(data);
        setError("");
      } catch (loadError) {
        setTicket(null);
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el boleto.");
      } finally {
        setLoading(false);
      }
    };

    void loadTicket();
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const generateQr = async () => {
      if (!ticket) {
        setQrUrl("");
        return;
      }

      try {
        const url = await QRCode.toDataURL(getQrContent(ticket), {
          width: 320,
          margin: 2,
          color: {
            dark: "#07111f",
            light: "#ffffff",
          },
        });

        if (!cancelled) {
          setQrUrl(url);
        }
      } catch {
        if (!cancelled) {
          setQrUrl("");
        }
      }
    };

    void generateQr();

    return () => {
      cancelled = true;
    };
  }, [ticket]);

  useEffect(() => {
    let cancelled = false;

    const loadEventLocation = async () => {
      if (!ticket) {
        setEventLocation("");
        return;
      }

      try {
        const event = await eventsUseCase.getEventById(ticket.evento_id);
        if (!cancelled) {
          setEventLocation(event.lugar?.trim() ?? "");
        }
      } catch {
        if (!cancelled) {
          setEventLocation("");
        }
      }
    };

    void loadEventLocation();

    return () => {
      cancelled = true;
    };
  }, [ticket]);

  return (
    <div className="modal-backdrop" role="main" aria-label="Vista pública de boleto">
      <section className="modal-card">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Boleto público</span>
            <h2>Acceso sin iniciar sesión</h2>
          </div>
          <Link className="ghost-button" to="/">
            Ir al login
          </Link>
        </div>

        {loading ? <p className="muted-copy">Cargando boleto...</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}

        {ticket ? (
          <div className="qr-ticket-preview">
            <div className="qr-code-frame">
              {qrUrl ? <img src={qrUrl} alt={`QR del boleto ${ticket.codigo}`} /> : null}
            </div>

            <div className="qr-ticket-meta">
              <strong>{ticket.cliente_nombre ?? `Cliente #${ticket.cliente_id}`}</strong>
              <span>{ticket.evento_nombre ?? `Evento #${ticket.evento_id}`}</span>
              <small>{ticket.codigo}</small>
            </div>

            <div className="qr-ticket-grid">
              <div className="qr-ticket-chip">
                <small>Teléfono</small>
                <strong>{ticket.cliente_telefono ?? "No disponible"}</strong>
              </div>
              <div className="qr-ticket-chip">
                <small>Precio</small>
                <strong>${Number(ticket.precio).toFixed(2)}</strong>
              </div>
              <div className="qr-ticket-chip">
                <small>Código evento</small>
                <strong>{ticket.codigo_evento ?? "Sin código"}</strong>
              </div>
              <div className="qr-ticket-chip">
                <small>Estado</small>
                <strong>{ticket.estado}</strong>
              </div>
              <div className="qr-ticket-chip">
                <small>Tipo</small>
                <strong>{ticket.tipo_boleto ?? "GENERAL"}</strong>
              </div>
              <div className="qr-ticket-chip">
                <small>RP</small>
                <strong>{ticket.rp_nombre ?? `RP #${ticket.rp_id}`}</strong>
              </div>
              <div className="qr-ticket-chip">
                <small>Fecha venta</small>
                <strong>{ticket.fecha_venta ? formatDateTime(ticket.fecha_venta) : "-"}</strong>
              </div>
              <div className="qr-ticket-chip">
                <small>Ubicación</small>
                <strong>{eventLocation || "No disponible"}</strong>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
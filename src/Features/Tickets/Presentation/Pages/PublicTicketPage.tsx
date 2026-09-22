import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import afterLogo from "../../../../assets/after.jpg";
import { formatDateTime, formatLongDate } from "../../../../Core/Utils/date";
import { eventsUseCase } from "../../../Events/Domain/EventsUseCase";
import "../../../Shared/Presentation/Components/dashboard-shell.css";
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
  const [eventInfo, setEventInfo] = useState<{ nombre: string; fecha: string; lugar: string } | null>(null);

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

    const loadEvent = async () => {
      if (!ticket) {
        setEventInfo(null);
        return;
      }

      try {
        const event = await eventsUseCase.getEventById(ticket.evento_id);
        if (!cancelled) {
          setEventInfo({ nombre: event.nombre, fecha: event.fecha_evento, lugar: event.lugar ?? "" });
        }
      } catch {
        if (!cancelled) {
          setEventInfo(null);
        }
      }
    };

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [ticket]);

  const displayEventName = ticket?.evento_nombre ?? eventInfo?.nombre ?? (ticket ? `Evento #${ticket.evento_id}` : "");
  const displayEventDate = eventInfo?.fecha ? formatLongDate(eventInfo.fecha) : "";

  return (
    <div className="modal-backdrop" role="main" aria-label="Vista pública de boleto">
      <section className="modal-card ticket-modal-card">
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
          <div className="qr-ticket-preview" style={{ backgroundImage: `url(${afterLogo})` }}>
            <div className="qr-ticket-overlay" />
            {displayEventDate ? (
              <div className="qr-ticket-date-vertical" aria-label={displayEventDate}>
                {displayEventDate.toUpperCase().split("").map((char, index) => (
                  <span key={index} aria-hidden="true" className={char === " " ? "qr-date-space" : undefined}>
                    {char === " " ? "" : char}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="qr-ticket-content">
              <div className="qr-ticket-header">
                <strong className="qr-ticket-event-name">{displayEventName}</strong>
              </div>

              <div className="qr-ticket-qr">
                <div className="qr-code-frame">
                  {qrUrl ? <img src={qrUrl} alt={`QR del boleto ${ticket.codigo}`} /> : null}
                </div>
                <span className="qr-ticket-code">{ticket.codigo}</span>
              </div>

              <div className="qr-ticket-footer">
                <strong className="qr-ticket-holder-name">{ticket.cliente_nombre ?? `Cliente #${ticket.cliente_id}`}</strong>
                {ticket.cliente_telefono ? <span className="qr-ticket-line">Tel: {ticket.cliente_telefono}</span> : null}
                <span className="qr-ticket-line">Vendió: {ticket.rp_nombre ?? `RP #${ticket.rp_id}`}</span>
                {eventInfo?.lugar ? <span className="qr-ticket-line">{eventInfo.lugar}</span> : null}
                {ticket.fecha_venta ? <span className="qr-ticket-line">Generado: {formatDateTime(ticket.fecha_venta)}</span> : null}
                <span className="qr-ticket-brand">AFTER by Experiencias Ambar</span>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

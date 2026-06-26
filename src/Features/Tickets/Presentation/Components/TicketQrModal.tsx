import html2canvas from "html2canvas";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "../../../../Core/Utils/date";
import { eventsUseCase } from "../../../Events/Domain/EventsUseCase";
import type { TicketDTO } from "../../Data/Models/Ticket";

type TicketQrModalProps = {
  ticket: TicketDTO;
  eventName?: string;
  eventLocation?: string;
  onClose: () => void;
};

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

export default function TicketQrModal({ ticket, eventName, eventLocation, onClose }: TicketQrModalProps) {
  const [qrUrl, setQrUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [resolvedEventLocation, setResolvedEventLocation] = useState("");
  const ticketCardRef = useRef<HTMLDivElement | null>(null);

  const downloadTicketImage = async () => {
    if (!ticketCardRef.current) {
      setDownloadError("No fue posible preparar la imagen del boleto.");
      return;
    }

    setDownloadingImage(true);
    setDownloadError("");

    try {
      const canvas = await html2canvas(ticketCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `boleto-${ticket.codigo}.png`;
      anchor.click();
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "No fue posible descargar la imagen del boleto.");
    } finally {
      setDownloadingImage(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const generateQr = async () => {
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
          setQrError("");
        }
      } catch (error) {
        if (!cancelled) {
          setQrError(error instanceof Error ? error.message : "No fue posible generar el QR.");
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
      if (eventLocation?.trim()) {
        setResolvedEventLocation(eventLocation.trim());
        return;
      }

      try {
        const event = await eventsUseCase.getEventById(ticket.evento_id);
        if (!cancelled) {
          setResolvedEventLocation(event.lugar?.trim() ?? "");
        }
      } catch {
        if (!cancelled) {
          setResolvedEventLocation("");
        }
      }
    };

    void loadEventLocation();

    return () => {
      cancelled = true;
    };
  }, [ticket.evento_id, eventLocation]);

  const locationLabel = resolvedEventLocation || "No disponible";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ticket-qr-title">
      <section className="modal-card">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Boleto generado</span>
            <h2 id="ticket-qr-title">QR listo para mostrar</h2>
          </div>
          <div className="modal-header-actions">
            <button
              type="button"
              className="ghost-button ticket-download-button"
              onClick={() => void downloadTicketImage()}
              aria-label="Descargar boleto como imagen"
              title="Descargar boleto"
              disabled={downloadingImage}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M12 3v11m0 0 4-4m-4 4-4-4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button type="button" className="ghost-button" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        <div className="qr-ticket-preview" ref={ticketCardRef}>
          <div className="qr-code-frame">
            {qrUrl ? <img src={qrUrl} alt={`QR del boleto ${ticket.codigo}`} /> : null}
          </div>

          {qrError ? <p className="inline-error">{qrError}</p> : null}
          {downloadError ? <p className="inline-error">{downloadError}</p> : null}

          <div className="qr-ticket-meta">
            <strong>{ticket.cliente_nombre ?? `Cliente #${ticket.cliente_id}`}</strong>
            <span>{eventName ?? `Evento #${ticket.evento_id}`}</span>
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
              <strong>{locationLabel}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

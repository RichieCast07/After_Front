import jsQR from "jsqr";
import { useContext, useEffect, useRef, useState } from "react";
import UserContext from "../../../../Core/Context/UserContext";
import DashboardShell from "../../../Shared/Presentation/Components/DashboardShell";
import type { TicketDTO } from "../../../Tickets/Data/Models/Ticket";
import { ticketsUseCase } from "../../../Tickets/Domain/TicketsUseCase";

type ScanState = "idle" | "requesting" | "scanning" | "success" | "error" | "unsupported";

function getCameraErrorMessage(error: unknown): string {
  const name = (error as { name?: string })?.name;

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Permiso de cámara denegado. Actívalo en el candado del navegador y recarga.";
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return "La cámara está en uso por otra app/pestaña. Ciérrala e inténtalo de nuevo.";
  }

  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return "No se pudo abrir con la cámara trasera. Se intentó modo compatible; prueba reiniciar cámara.";
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No se detectó una cámara disponible en este dispositivo.";
  }

  if (name === "SecurityError") {
    return "El navegador bloqueó la cámara por seguridad. Usa HTTPS o localhost.";
  }

  return "No se pudo abrir la cámara. Verifica permisos de navegador y sistema.";
}

function extractTicketCode(rawInput: string): string {
  const value = rawInput.trim();
  if (!value) {
    return "";
  }

  if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith('"') && value.endsWith('"'))) {
    try {
      const parsed = JSON.parse(value) as { codigo?: string };
      if (parsed?.codigo) {
        return String(parsed.codigo).trim();
      }
    } catch {
      return value;
    }
  }

  return value;
}

export default function ManagerScannerPage() {
  const session = useContext(UserContext);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const scanTimerRef = useRef<number | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [lastCode, setLastCode] = useState("");
  const [message, setMessage] = useState("Listo para validar accesos.");
  const [busy, setBusy] = useState(false);
  const [lastValidatedTicket, setLastValidatedTicket] = useState<TicketDTO | null>(null);
  const [resultModal, setResultModal] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    detail: string;
  }>({
    open: false,
    type: "success",
    title: "",
    detail: "",
  });

  const tabs = [{ id: "scanner", label: "Escáner acceso", icon: "📷" }];

  const openCameraStream = async () => {
    const candidates: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { exact: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let lastError: unknown = null;
    for (const constraints of candidates) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  };

  const stopScanner = () => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const validateAndConsumeTicket = async (rawCode: string) => {
    const code = extractTicketCode(rawCode);
    if (!code || busy || resultModal.open) {
      return;
    }

    setBusy(true);
    try {
      const ticket = await ticketsUseCase.getTicketByCode(code);
      const updatedTicket = await ticketsUseCase.markTicketAsUsed(ticket.codigo);
      setLastCode(updatedTicket.codigo);
      setLastValidatedTicket(updatedTicket);
      setMessage(`Acceso concedido. ${updatedTicket.cliente_nombre ?? "Cliente"} validado correctamente.`);
      setScanState("success");
      stopScanner();
      setResultModal({
        open: true,
        type: "success",
        title: "Acceso listo",
        detail: `${updatedTicket.cliente_nombre ?? "Cliente"} validado correctamente.`,
      });
    } catch (error) {
      setLastValidatedTicket(null);
      const errorMessage = error instanceof Error ? error.message : "No fue posible validar el boleto.";
      setMessage(errorMessage);
      setScanState("error");
      stopScanner();
      setResultModal({
        open: true,
        type: "error",
        title: "Error de validación",
        detail: errorMessage,
      });
    } finally {
      setBusy(false);
    }
  };

  const scanFrame = async () => {
    if (!videoRef.current || busy) {
      return;
    }

    if (videoRef.current.readyState < 2) {
      return;
    }

    try {
      if (detectorRef.current) {
        const results = await detectorRef.current.detect(videoRef.current);
        if (Array.isArray(results) && results.length > 0) {
          const detectedCode = String(results[0]?.rawValue ?? "");
          if (detectedCode) {
            await validateAndConsumeTicket(detectedCode);
          }
        }
        return;
      }

      if (!canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        return;
      }

      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      if (!width || !height) {
        return;
      }

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.drawImage(videoRef.current, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const qrCode = jsQR(imageData.data, width, height, { inversionAttempts: "dontInvert" });

      if (qrCode?.data) {
        await validateAndConsumeTicket(String(qrCode.data));
      }
    } catch {
      
    }
  };

  const startScanner = async () => {
    if (scanState === "requesting") {
      return;
    }

    const BarcodeDetectorApi = (window as any).BarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanState("unsupported");
      setMessage("Este dispositivo no permite acceso a cámara desde el navegador.");
      return;
    }

    stopScanner();
    setScanState("requesting");
    setMessage("Solicitando acceso a la cámara...");

    try {
      const stream = await openCameraStream();

      streamRef.current = stream;
      detectorRef.current = BarcodeDetectorApi ? new BarcodeDetectorApi({ formats: ["qr_code"] }) : null;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanState("scanning");
      setMessage(
        detectorRef.current
          ? "Escáner activo. Apunta al QR del boleto."
          : "Escáner activo (modo compatible). Apunta al QR del boleto."
      );

      scanTimerRef.current = window.setInterval(() => {
        void scanFrame();
      }, 600);
    } catch (error) {
      setScanState("error");
      setMessage(getCameraErrorMessage(error));
    }
  };

  return (
    <DashboardShell
      title="Control de accesos"
      username={session?.user?.username ?? "manager"}
      badge="Manager"
      tabs={tabs}
      activeTab="scanner"
      onTabChange={() => undefined}
      onLogout={() => session?.logout()}
    >
      {resultModal.open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="scan-result-title">
          <section className="modal-card">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">{resultModal.type === "success" ? "Validación" : "Atención"}</span>
                <h2 id="scan-result-title">{resultModal.title}</h2>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setResultModal((current) => ({ ...current, open: false }))}
              >
                Cerrar
              </button>
            </div>

            <p className={resultModal.type === "error" ? "inline-error" : "muted-copy"}>{resultModal.detail}</p>

            {resultModal.type === "success" && lastValidatedTicket ? (
              <div className="detail-grid">
                <article className="detail-card">
                  <h3>{lastValidatedTicket.cliente_nombre ?? `Cliente #${lastValidatedTicket.cliente_id}`}</h3>
                  <p>{lastValidatedTicket.cliente_telefono ?? "Sin teléfono"}</p>
                  <small>{lastValidatedTicket.codigo}</small>
                </article>
                <article className="detail-card">
                  <h3>Evento</h3>
                  <p>{lastValidatedTicket.codigo_evento ?? `Evento #${lastValidatedTicket.evento_id}`}</p>
                  <small>Estado {lastValidatedTicket.estado}</small>
                </article>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      <section className="glass-panel manager-grid">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Scanner</span>
            <h2>Validación en puerta</h2>
          </div>
          <span className="status-chip">Estado: {scanState}</span>
        </div>

        <div className="manager-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => void startScanner()}
            disabled={busy || scanState === "requesting"}
          >
            Iniciar cámara
          </button>
          <button type="button" className="ghost-button" onClick={stopScanner}>
            Detener cámara
          </button>
        </div>

        <div className="camera-frame">
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <p className={scanState === "error" ? "inline-error" : "muted-copy"}>{message}</p>

        {lastCode ? (
          <div className="highlight-card">
            <strong>Último ticket validado</strong>
            <span>{lastCode}</span>
          </div>
        ) : null}

        {lastValidatedTicket ? (
          <div className="detail-grid">
            <article className="detail-card">
              <h3>{lastValidatedTicket.cliente_nombre ?? `Cliente #${lastValidatedTicket.cliente_id}`}</h3>
              <p>{lastValidatedTicket.cliente_telefono ?? "Sin teléfono"}</p>
              <small>{lastValidatedTicket.codigo}</small>
            </article>
            <article className="detail-card">
              <h3>Evento</h3>
              <p>{lastValidatedTicket.codigo_evento ?? `Evento #${lastValidatedTicket.evento_id}`}</p>
              <small>Estado {lastValidatedTicket.estado}</small>
            </article>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}

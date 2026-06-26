import type { ClientDTO } from "../../Data/Models/Client";

interface ClientsPanelProps {
  clients: ClientDTO[];
  selectedClientId: number | null;
  setSelectedClientId: (clientId: number) => void;
  searchPhone: string;
  setSearchPhone: (value: string) => void;
  searchResult: ClientDTO | null;
  loading: boolean;
  downloading: boolean;
  error: string;
  onCreateClick?: () => void;
  onSearch: () => void;
  onDownloadCsv: () => void;
}

export default function ClientsPanel({
  clients,
  selectedClientId,
  setSelectedClientId,
  searchPhone,
  setSearchPhone,
  searchResult,
  loading,
  downloading,
  error,
  onCreateClick,
  onSearch,
  onDownloadCsv,
}: ClientsPanelProps) {
  return (
    <section className="glass-panel panel-grid">
      <div>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Clients</span>
            <h2>Base de clientes</h2>
          </div>
          <span className="status-chip">{clients.length} registrados</span>
        </div>

        <div className="inline-search">
          <input
            placeholder="Buscar por telefono"
            value={searchPhone}
            onChange={(event) => setSearchPhone(event.target.value)}
          />
          <button type="button" className="ghost-button" disabled={loading} onClick={onSearch}>
            Buscar
          </button>
          <button type="button" className="ghost-button" disabled={downloading} onClick={onDownloadCsv}>
            {downloading ? "Descargando..." : "Descargar CSV"}
          </button>
          {onCreateClick ? (
            <button type="button" className="primary-button" onClick={onCreateClick}>
              Nuevo cliente
            </button>
          ) : null}
        </div>

        {searchResult ? (
          <div className="highlight-card">
            <strong>{searchResult.nombre_completo}</strong>
            <span>{searchResult.telefono}</span>
          </div>
        ) : null}

        {loading ? <p className="muted-copy">Cargando clientes...</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}

        <div className="collection-list compact-list">
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              className={`selector-card ${selectedClientId === client.id ? "selector-card-active" : ""}`}
              onClick={() => setSelectedClientId(client.id)}
            >
              <strong>{client.nombre_completo}</strong>
              <span>{client.telefono}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
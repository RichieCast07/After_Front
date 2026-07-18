import type { ClientDTO } from "../../Data/Models/Client";

interface ClientsPanelProps {
  clients: ClientDTO[];
  searchPhone: string;
  setSearchPhone: (value: string) => void;
  searchResult: ClientDTO | null;
  loading: boolean;
  downloading: boolean;
  error: string;
  onCreateClick?: () => void;
  onEdit?: (client: ClientDTO) => void;
  onSearch: () => void;
  onDownloadCsv: () => void;
}

export default function ClientsPanel({
  clients,
  searchPhone,
  setSearchPhone,
  searchResult,
  loading,
  downloading,
  error,
  onCreateClick,
  onEdit,
  onSearch,
  onDownloadCsv,
}: ClientsPanelProps) {
  return (
    <section className="glass-panel panel-grid">
      <div>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Clientes</span>
            <h2>Base de clientes</h2>
          </div>
          <span className="status-chip">{clients.length} registrados</span>
        </div>

        <div className="inline-search">
          <input
            placeholder="Buscar por teléfono"
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
            <article key={client.id} className="collection-card list-card">
              <div className="list-card-info">
                <h3>{client.nombre_completo}</h3>
                <p>{client.telefono}</p>
              </div>
              {onEdit ? (
                <div className="list-card-actions">
                  <button type="button" className="ghost-button" onClick={() => onEdit(client)}>
                    Editar
                  </button>
                </div>
              ) : null}
            </article>
          ))}
          {clients.length === 0 && !loading ? (
            <p className="muted-copy">Aún no hay clientes registrados.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
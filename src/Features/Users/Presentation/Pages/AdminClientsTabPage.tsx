import { useState } from "react";
import ClientsPanel from "../../../Clients/Presentation/Components/ClientsPanel";
import { useClientsViewModel } from "../../../Clients/Presentation/ViewModels/useClientsViewModel";
import FormModal from "../../../Shared/Presentation/Components/FormModal";

export default function AdminClientsTabPage() {
  const clientsVm = useClientsViewModel();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const submit = async () => {
    const success = await clientsVm.createClient();
    if (success) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <ClientsPanel
        clients={clientsVm.clients}
        selectedClientId={clientsVm.selectedClientId}
        setSelectedClientId={(id) => clientsVm.setSelectedClientId(id)}
        searchPhone={clientsVm.searchPhone}
        setSearchPhone={clientsVm.setSearchPhone}
        searchResult={clientsVm.searchResult}
        loading={clientsVm.loading}
        downloading={clientsVm.downloading}
        error={clientsVm.error}
        onCreateClick={() => setIsModalOpen(true)}
        onSearch={() => void clientsVm.searchClient()}
        onDownloadCsv={() => void clientsVm.downloadCsv()}
      />

      {isModalOpen ? (
        <FormModal title="Crear cliente" subtitle="Clientes" onClose={() => setIsModalOpen(false)}>
          <div className="field-grid">
            <label>
              <span>Nombre completo</span>
              <input
                value={clientsVm.form.nombre_completo}
                onChange={(event) => clientsVm.handleFormChange("nombre_completo", event.target.value)}
              />
            </label>
            <label>
              <span>Teléfono</span>
              <input
                value={clientsVm.form.telefono}
                onChange={(event) => clientsVm.handleFormChange("telefono", event.target.value)}
              />
            </label>
          </div>

          <div className="action-row">
            <button type="button" className="primary-button" disabled={clientsVm.saving} onClick={() => void submit()}>
              {clientsVm.saving ? "Guardando..." : "Crear"}
            </button>
            <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
          </div>
        </FormModal>
      ) : null}
    </>
  );
}

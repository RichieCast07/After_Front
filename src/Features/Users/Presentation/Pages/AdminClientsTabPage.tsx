import { useState } from "react";
import type { ClientDTO } from "../../../Clients/Data/Models/Client";
import ClientsPanel from "../../../Clients/Presentation/Components/ClientsPanel";
import { useClientsViewModel } from "../../../Clients/Presentation/ViewModels/useClientsViewModel";
import FormModal from "../../../Shared/Presentation/Components/FormModal";

export default function AdminClientsTabPage() {
  const clientsVm = useClientsViewModel();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCreate = () => {
    clientsVm.resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (client: ClientDTO) => {
    clientsVm.handleEdit(client);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    clientsVm.resetForm();
    setIsModalOpen(false);
  };

  const submit = async () => {
    const success = await clientsVm.submit();
    if (success) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <ClientsPanel
        clients={clientsVm.clients}
        searchPhone={clientsVm.searchPhone}
        setSearchPhone={clientsVm.setSearchPhone}
        searchResult={clientsVm.searchResult}
        loading={clientsVm.loading}
        downloading={clientsVm.downloading}
        error={clientsVm.error}
        onCreateClick={openCreate}
        onEdit={openEdit}
        onSearch={() => void clientsVm.searchClient()}
        onDownloadCsv={() => void clientsVm.downloadCsv()}
      />

      {isModalOpen ? (
        <FormModal
          title={clientsVm.editingId ? "Editar cliente" : "Crear cliente"}
          subtitle="Clientes"
          error={clientsVm.error}
          onClose={closeModal}
        >
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
              {clientsVm.saving ? "Guardando..." : clientsVm.editingId ? "Guardar" : "Crear"}
            </button>
            <button type="button" className="ghost-button" onClick={closeModal}>
              Cancelar
            </button>
          </div>
        </FormModal>
      ) : null}
    </>
  );
}

import { useEffect, useState } from "react";
import type { RegisterUserDTO } from "../../Data/Models/RegisterUserDTO";
import type { UserResponseDTO } from "../../Data/Models/UserResponseDTO";
import { teamUseCase } from "../../Domain/TeamUseCase";

const initialForm: RegisterUserDTO = {
  nombre_completo: "",
  username: "",
  telefono: 0,
  password: "",
  rol_id: 2,
  comision_porcentaje: 10,
};

export function useTeamViewModel() {
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [selectedRole, setSelectedRole] = useState<number>(0);
  const [form, setForm] = useState<RegisterUserDTO>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = selectedRole
        ? await teamUseCase.getUsersByRole(selectedRole)
        : await teamUseCase.getUsers();
      setUsers(response.data);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el equipo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [selectedRole]);

  const handleChange = (field: keyof RegisterUserDTO, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleEdit = (user: UserResponseDTO) => {
    setForm({
      nombre_completo: user.nombre_completo,
      username: user.username,
      telefono: Number(user.telefono) || 0,
      password: "",
      rol_id: user.rol_id,
      comision_porcentaje: Number(user.comision_porcentaje ?? 10),
    });
    setEditingId(user.id);
  };

  const submit = async () => {
    const cleanName = form.nombre_completo.trim();
    const cleanUsername = form.username.trim();
    const phoneAsString = String(form.telefono ?? "").replace(/\D/g, "");
    const roleId = Number(form.rol_id);
    const commission = Number(form.comision_porcentaje ?? 10);

    if (!cleanName || !cleanUsername || !phoneAsString) {
      setError("Todos los campos son obligatorios.");
      return false;
    }

    if (!editingId && !form.password) {
      setError("La contraseña es obligatoria al crear un usuario.");
      return false;
    }

    if (phoneAsString.length !== 10) {
      setError("El teléfono debe tener exactamente 10 dígitos.");
      return false;
    }

    if (form.password && form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }

    if (roleId !== 2 && roleId !== 3) {
      setError("Rol inválido. Usa RP o Manager.");
      return false;
    }

    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      setError("La comisión debe estar entre 0 y 100.");
      return false;
    }

    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await teamUseCase.updateUser(editingId, {
          nombre_completo: cleanName,
          username: cleanUsername,
          telefono: Number(phoneAsString),
          comision_porcentaje: roleId === 2 ? commission : 0,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await teamUseCase.createUser({
          ...form,
          nombre_completo: cleanName,
          username: cleanUsername,
          telefono: Number(phoneAsString),
          rol_id: roleId,
          comision_porcentaje: roleId === 2 ? commission : 0,
        });
      }
      resetForm();
      await loadUsers();
      return true;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible guardar el usuario.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: number) => {
    setError("");
    try {
      await teamUseCase.deleteUser(id);
      await loadUsers();
      return true;
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar el usuario.");
      return false;
    }
  };

  return {
    users,
    selectedRole,
    setSelectedRole,
    form,
    editingId,
    loading,
    saving,
    error,
    handleChange,
    handleEdit,
    resetForm,
    submit,
    deleteUser,
    reload: loadUsers,
  };
}

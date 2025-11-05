import { useEffect, useState } from "react";
import type { ReactElement, FormEvent } from "react";
import type { User } from "../types";
import { updateUser } from "../service";
import { http } from "../../../shared/api/client";

type Props = {
  user: User | null;
  onClose: () => void;
  onSaved?: () => void;
};

export default function UserEditModal({ user, onClose, onSaved }: Props): ReactElement | null {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    role: "usuario" as User["role"]
  });
  const [saving, setSaving] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<{ id: number; name: string }[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        nombre: user.nombre ?? "",
        email: user.email ?? "",
        telefono: user.telefono ?? "",
        role: user.role ?? "usuario"
      });
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await http.get("/api/User/group");
        if (!mounted) return;
        setAvailableGroups(r.data ?? []);
      } catch {
        setAvailableGroups([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // `group_id` puede no formar parte del tipo `User` TS; usar cast seguro
  useEffect(() => {
    if (!user) return;
    const gid = user?.group_id;
    setGroupId(gid != null ? Number(gid) : null);
  }, [user]);

  if (!user) return null;

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await updateUser(user.id, {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        role: form.role
      });
      if (groupId != null) {
        try {
          await http.post(`/api/User/${user.id}/group`, { group_id: groupId });
        } catch (e) {
          console.warn("No se pudo asignar grupo en backend:", e);
        }
      }
      onSaved?.();
      onClose();
    } catch {
      alert("No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-modal" role="dialog" aria-modal="true">
      <div className="ui-modal__content">
        <header className="ui-modal__header">
          <h3>Editar usuario</h3>
          <button className="ui-btn ui-btn--ghost" onClick={onClose}>×</button>
        </header>
        <div className="ui-modal__body">
          <form className="ui-form" onSubmit={handleSave}>
            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Nombre</label>
                <input className="ui-input" value={form.nombre} onChange={(e) => setForm(s => ({ ...s, nombre: e.target.value }))} />
              </div>
              <div className="ui-form__field">
                <label className="ui-label">Email</label>
                <input className="ui-input" type="email" value={form.email} onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} />
              </div>
            </div>

            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Teléfono</label>
                <input className="ui-input" value={form.telefono} onChange={(e) => setForm(s => ({ ...s, telefono: e.target.value }))} />
              </div>
              <div className="ui-form__field">
                <label className="ui-label">Rol</label>
                <select className="ui-select" value={form.role} onChange={(e) => setForm(s => ({ ...s, role: e.target.value as User["role"] }))}>
                  <option value="superadmin">Superadmin</option>
                  <option value="administrador">Administrador</option>
                  <option value="gerente">Gerente</option>
                  <option value="contador">Contador</option>
                  <option value="usuario">Usuario</option>
                </select>
              </div>
            </div>

            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Grupo</label>
                <select className="ui-select" value={groupId ?? ""} onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">(sin grupo)</option>
                  {availableGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>

            <div className="ui-form__actions">
              <button type="submit" className="ui-btn ui-btn--primary" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

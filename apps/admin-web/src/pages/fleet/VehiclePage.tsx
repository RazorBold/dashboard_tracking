import { useState, useMemo } from 'react';
import { Plus, Download, Search, Loader2, AlertTriangle, X } from 'lucide-react';
import { VehicleTable } from '../../components/fleet/VehicleTable';
import { VehicleFormModal } from '../../components/fleet/VehicleFormModal';
import { useVehicles } from '../../hooks/useVehicles';
import { useVehicleMutations } from '../../hooks/useVehicleMutations';
import { useDevices } from '../../hooks/useDevices';
import type { Vehicle, VehicleFormValues, VehicleStatus } from '../../types/vehicle';

const STATUS_TABS: Array<{ label: string; value: VehicleStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Retired', value: 'retired' },
];

export function VehiclePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | undefined>();

  const { data, isLoading, isError } = useVehicles({
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const { data: devicesData } = useDevices(1, 500);
  const { create, update, remove, bindDevice, unbindDevice, exportCsv } = useVehicleMutations();

  const vehicles = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const devices = devicesData?.data ?? [];

  // Map deviceId → Device for fast table lookup
  const deviceMap = useMemo(
    () => new Map(devices.map((d) => [d.id, d])),
    [devices],
  );

  const handleCreate = (values: VehicleFormValues) => {
    create.mutate(values, { onSuccess: () => setFormOpen(false) });
  };

  const handleUpdate = (values: VehicleFormValues) => {
    if (!editVehicle) return;
    update.mutate({ id: editVehicle.id, payload: values }, { onSuccess: () => setEditVehicle(undefined) });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
  };

  const handleBind = (deviceId: string) => {
    if (!editVehicle) return;
    bindDevice.mutate({ vehicleId: editVehicle.id, deviceId });
  };

  const handleUnbind = () => {
    if (!editVehicle) return;
    unbindDevice.mutate(editVehicle.id);
  };

  return (
    <div className="device-page">
      {/* Header */}
      <div className="device-page__header">
        <div>
          <h1 className="device-page__title">Vehicles</h1>
          <p className="device-page__subtitle">{total} vehicle{total !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="device-page__actions">
          <button className="btn btn--ghost" onClick={exportCsv}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn--primary" onClick={() => setFormOpen(true)}>
            <Plus size={15} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="device-page__toolbar">
        <div className="device-page__search">
          <Search size={14} className="device-page__search-icon" />
          <input
            type="text"
            placeholder="Search plate no or owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="device-page__search-input"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="device-page__tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`device-page__tab${statusFilter === tab.value ? ' device-page__tab--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="device-page__loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading vehicles…</span>
        </div>
      ) : isError ? (
        <div className="device-page__error">Failed to load vehicles. Check your connection.</div>
      ) : (
        <VehicleTable
          vehicles={vehicles}
          deviceMap={deviceMap}
          onEdit={(v) => setEditVehicle(v)}
          onDelete={(v) => setDeleteTarget(v)}
        />
      )}

      {/* Create modal */}
      <VehicleFormModal
        open={formOpen}
        devices={devices}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Edit modal */}
      <VehicleFormModal
        open={Boolean(editVehicle)}
        vehicle={editVehicle}
        devices={devices}
        onClose={() => setEditVehicle(undefined)}
        onSubmit={handleUpdate}
        onBindDevice={handleBind}
        onUnbindDevice={handleUnbind}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal--sm">
            <div className="modal__icon modal__icon--danger">
              <AlertTriangle size={28} />
            </div>
            <h2 className="modal__title">Delete Vehicle</h2>
            <p className="modal__desc">
              Are you sure you want to delete <strong>{deleteTarget.plateNo}</strong>? This action cannot be undone.
            </p>
            <div className="modal__footer modal__footer--center">
              <button className="btn btn--ghost" onClick={() => setDeleteTarget(undefined)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={remove.isPending}>
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

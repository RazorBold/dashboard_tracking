import { useState, useMemo } from 'react';
import { Plus, Download, Search, Loader2 } from 'lucide-react';
import { DeviceTable } from '../../components/device/DeviceTable';
import { DeviceFormModal } from '../../components/device/DeviceFormModal';
import { DeleteDialog } from '../../components/device/DeleteDialog';
import { useDevices } from '../../hooks/useDevices';
import { useDeviceMutations } from '../../hooks/useDeviceMutations';
import type { Device, DeviceStatus } from '../../types/device';

type StatusFilter = 'all' | DeviceStatus;

export function DeviceListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Device | undefined>();

  const { data, isLoading, isError } = useDevices(1, 500);
  const { create, update, remove, exportCsv } = useDeviceMutations();

  const devices = data?.data ?? [];

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.imei.includes(q);
      }
      return true;
    });
  }, [devices, search, statusFilter]);

  const handleCreate = (values: { name: string; imei?: string; model?: string }) => {
    create.mutate(
      { name: values.name, imei: values.imei!, model: values.model },
      { onSuccess: () => setFormOpen(false) },
    );
  };

  const handleUpdate = (values: { name?: string; imei?: string; model?: string }) => {
    if (!editDevice) return;
    update.mutate(
      { id: editDevice.id, payload: { name: values.name, model: values.model } },
      { onSuccess: () => setEditDevice(undefined) },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
  };

  const STATUS_TABS: StatusFilter[] = ['all', 'online', 'offline', 'inactive', 'expired'];

  return (
    <div className="device-page">
      {/* Page header */}
      <div className="device-page__header">
        <div>
          <h1 className="device-page__title">Devices</h1>
          <p className="device-page__subtitle">
            {data?.meta.total ?? 0} device{(data?.meta.total ?? 0) !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div className="device-page__actions">
          <button className="btn btn--ghost" onClick={exportCsv}>
            <Download size={15} />
            Export CSV
          </button>
          <button className="btn btn--primary" onClick={() => setFormOpen(true)}>
            <Plus size={15} />
            Add Device
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="device-page__toolbar">
        <div className="device-page__search">
          <Search size={14} className="device-page__search-icon" />
          <input
            type="text"
            placeholder="Search name or IMEI…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="device-page__search-input"
          />
        </div>
        <div className="device-page__tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`device-page__tab${statusFilter === tab ? ' device-page__tab--active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="device-page__loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading devices…</span>
        </div>
      ) : isError ? (
        <div className="device-page__error">Failed to load devices. Check your connection.</div>
      ) : (
        <DeviceTable
          devices={filtered}
          onEdit={(d) => setEditDevice(d)}
          onDelete={(d) => setDeleteTarget(d)}
        />
      )}

      {/* Create modal */}
      <DeviceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Edit modal */}
      <DeviceFormModal
        open={Boolean(editDevice)}
        device={editDevice}
        onClose={() => setEditDevice(undefined)}
        onSubmit={handleUpdate}
      />

      {/* Delete dialog */}
      <DeleteDialog
        open={Boolean(deleteTarget)}
        deviceName={deleteTarget?.name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(undefined)}
      />
    </div>
  );
}

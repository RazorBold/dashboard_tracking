import { useState } from 'react';
import { Plus, Download, Search, Loader2, AlertTriangle, X } from 'lucide-react';
import { DriverTable } from '../../components/fleet/DriverTable';
import { DriverFormModal } from '../../components/fleet/DriverFormModal';
import { useDrivers } from '../../hooks/useDrivers';
import { useDriverMutations } from '../../hooks/useDriverMutations';
import type { Driver, DriverFormValues } from '../../types/driver';

export function DriverPage() {
  const [search, setSearch] = useState('');
  const [registerPlace, setRegisterPlace] = useState('');
  const [licenseExpiredFilter, setLicenseExpiredFilter] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Driver | undefined>();

  const { data, isLoading, isError } = useDrivers({
    search: search || undefined,
    registerPlace: registerPlace || undefined,
    licenseExpired: licenseExpiredFilter || undefined,
  });

  const { create, update, remove, exportCsv } = useDriverMutations();

  const drivers = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const handleCreate = (values: DriverFormValues) => {
    create.mutate(values, { onSuccess: () => setFormOpen(false) });
  };

  const handleUpdate = (values: DriverFormValues) => {
    if (!editDriver) return;
    update.mutate({ id: editDriver.id, payload: values }, { onSuccess: () => setEditDriver(undefined) });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
  };

  return (
    <div className="device-page">
      {/* Header */}
      <div className="device-page__header">
        <div>
          <h1 className="device-page__title">Drivers</h1>
          <p className="device-page__subtitle">{total} driver{total !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="device-page__actions">
          <button className="btn btn--ghost" onClick={exportCsv}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn--primary" onClick={() => setFormOpen(true)}>
            <Plus size={15} /> Add Driver
          </button>
        </div>
      </div>

      {/* Search / Filter bar */}
      <div className="device-page__toolbar flex-wrap gap-2">
        <div className="device-page__search">
          <Search size={14} className="device-page__search-icon" />
          <input
            type="text"
            placeholder="Search name or driver no…"
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

        <div className="device-page__search" style={{ width: 180 }}>
          <Search size={14} className="device-page__search-icon" />
          <input
            type="text"
            placeholder="Register place…"
            value={registerPlace}
            onChange={(e) => setRegisterPlace(e.target.value)}
            className="device-page__search-input"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={licenseExpiredFilter}
            onChange={(e) => setLicenseExpiredFilter(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          License Expired
        </label>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="device-page__loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading drivers…</span>
        </div>
      ) : isError ? (
        <div className="device-page__error">Failed to load drivers. Check your connection.</div>
      ) : (
        <DriverTable
          drivers={drivers}
          onEdit={(d) => setEditDriver(d)}
          onDelete={(d) => setDeleteTarget(d)}
        />
      )}

      {/* Create modal */}
      <DriverFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />

      {/* Edit modal */}
      <DriverFormModal
        open={Boolean(editDriver)}
        driver={editDriver}
        onClose={() => setEditDriver(undefined)}
        onSubmit={handleUpdate}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal modal--sm">
            <div className="modal__icon modal__icon--danger">
              <AlertTriangle size={28} />
            </div>
            <h2 className="modal__title">Delete Driver</h2>
            <p className="modal__desc">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
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

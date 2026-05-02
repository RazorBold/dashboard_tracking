import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Pencil, Shield, Circle as CircleIcon, Pentagon, Loader2, X, Check } from 'lucide-react';
import { GeofenceMapPanel } from '../../components/geofence/GeofenceMapPanel';
import { useGeofences } from '../../hooks/useGeofences';
import { useGeofenceMutations } from '../../hooks/useGeofenceMutations';
import { useDevices } from '../../hooks/useDevices';
import type { Geofence, GeofenceType, CircleGeometry, PolygonGeometry } from '../../types/geofence';

// ─── Form schema ──────────────────────────────────────
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  assignedDeviceIds: z.array(z.string()).optional(),
});
type FormValues = z.infer<typeof schema>;

type PageMode = 'list' | 'create' | 'edit';

const TYPE_LABEL: Record<GeofenceType, string> = {
  circle: 'Circle',
  polygon: 'Polygon',
};

function fmtRadius(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function GeofencePage() {
  const [pageMode, setPageMode] = useState<PageMode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Geofence | null>(null);

  // Drawing state
  const [drawType, setDrawType] = useState<GeofenceType>('circle');
  const [draftCenter, setDraftCenter] = useState<[number, number] | null>(null);
  const [draftRadius, setDraftRadius] = useState<number>(500);
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);

  const { data: fences = [], isLoading } = useGeofences();
  const { create, update, remove } = useGeofenceMutations();
  const { data: devicesData } = useDevices(1, 500);
  const devices = devicesData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // ─── Map click handler ─────────────────────────────
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (pageMode === 'create' || pageMode === 'edit') {
      if (drawType === 'circle') {
        setDraftCenter([lat, lng]);
      } else {
        setDraftPoints((prev) => [...prev, [lat, lng]]);
      }
    }
  }, [pageMode, drawType]);

  // ─── Open create ───────────────────────────────────
  const openCreate = () => {
    setPageMode('create');
    setEditTarget(null);
    setDrawType('circle');
    setDraftCenter(null);
    setDraftRadius(500);
    setDraftPoints([]);
    reset({ name: '', description: '', assignedDeviceIds: [] });
  };

  // ─── Open edit ────────────────────────────────────
  const openEdit = (fence: Geofence) => {
    setEditTarget(fence);
    setPageMode('edit');
    setDrawType(fence.type);
    const geo = fence.geometry as any;
    if (fence.type === 'circle') {
      setDraftCenter([geo.center.lat, geo.center.lng]);
      setDraftRadius(geo.radius);
    } else {
      setDraftPoints(geo.points.map((p: any) => [p.lat, p.lng] as [number, number]));
    }
    reset({
      name: fence.name,
      description: fence.description ?? '',
      assignedDeviceIds: fence.assignedDeviceIds ?? [],
    });
  };

  const cancelForm = () => {
    setPageMode('list');
    setEditTarget(null);
    setDraftCenter(null);
    setDraftPoints([]);
    reset();
  };

  // ─── Submit ───────────────────────────────────────
  const onSubmit = (values: FormValues) => {
    let geometry: CircleGeometry | PolygonGeometry;

    if (drawType === 'circle') {
      if (!draftCenter) return;
      geometry = { center: { lat: draftCenter[0], lng: draftCenter[1] }, radius: draftRadius };
    } else {
      if (draftPoints.length < 3) return;
      geometry = { points: draftPoints.map(([lat, lng]) => ({ lat, lng })) };
    }

    const payload = {
      name: values.name,
      type: drawType,
      geometry,
      description: values.description || null,
      assignedDeviceIds: values.assignedDeviceIds ?? [],
    };

    if (pageMode === 'edit' && editTarget) {
      update.mutate({ id: editTarget.id, payload }, { onSuccess: cancelForm });
    } else {
      create.mutate(payload, { onSuccess: cancelForm });
    }
  };

  const drawMode = (pageMode === 'create' || pageMode === 'edit') ? drawType : 'none';
  const isPending = create.isPending || update.isPending;

  const geometryReady = drawType === 'circle' ? !!draftCenter : draftPoints.length >= 3;

  return (
    <div className="device-page">
      {/* Header */}
      <div className="device-page__header">
        <div>
          <h1 className="device-page__title">Geo-fence</h1>
          <p className="device-page__subtitle">{fences.length} fence{fences.length !== 1 ? 's' : ''} defined</p>
        </div>
        {pageMode === 'list' && (
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={15} /> New Geo-fence
          </button>
        )}
      </div>

      {/* 2-panel layout */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 136px)' }}>
        {/* Left panel */}
        <aside className="w-72 flex-shrink-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          {pageMode === 'list' ? (
            /* Fence list */
            isLoading ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : fences.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm p-4 text-center">
                <Shield size={28} className="opacity-30" />
                <p>No geo-fences yet.</p>
                <p className="text-xs">Click "New Geo-fence" to draw one on the map.</p>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {fences.map((fence) => (
                  <li
                    key={fence.id}
                    onClick={() => setSelectedId(fence.id === selectedId ? null : fence.id)}
                    className={`group px-3 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedId === fence.id ? 'bg-primary-50 border-l-2 border-primary-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{fence.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {fence.type === 'circle'
                            ? <CircleIcon size={10} className="text-slate-400" />
                            : <Pentagon size={10} className="text-slate-400" />}
                          <span className="text-[11px] text-slate-500">{TYPE_LABEL[fence.type]}</span>
                          {fence.type === 'circle' && (
                            <span className="text-[11px] text-slate-400">
                              · {fmtRadius((fence.geometry as CircleGeometry).radius)}
                            </span>
                          )}
                        </div>
                        {(fence.assignedDeviceIds?.length ?? 0) > 0 && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {fence.assignedDeviceIds.length} device{fence.assignedDeviceIds.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(fence); }}
                          className="p-1 rounded hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove.mutate(fence.id, { onSuccess: () => { if (selectedId === fence.id) setSelectedId(null); } });
                          }}
                          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            /* Create / Edit form */
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">{pageMode === 'edit' ? 'Edit Geo-fence' : 'New Geo-fence'}</h3>
                <button onClick={cancelForm} className="text-slate-400 hover:text-slate-600">
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {/* Type selector (create only) */}
                {pageMode === 'create' && (
                  <div className="form-field">
                    <label className="form-label">Shape</label>
                    <div className="flex gap-2">
                      {(['circle', 'polygon'] as GeofenceType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setDrawType(t); setDraftCenter(null); setDraftPoints([]); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors ${drawType === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                        >
                          {t === 'circle' ? <CircleIcon size={13} /> : <Pentagon size={13} />}
                          {TYPE_LABEL[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drawing instructions */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                  {drawType === 'circle'
                    ? draftCenter
                      ? <span className="flex items-center gap-1"><Check size={11} /> Center set — adjust radius below</span>
                      : '← Click anywhere on the map to set the circle center'
                    : draftPoints.length < 3
                      ? `← Click the map to add points (${draftPoints.length} added, min 3)`
                      : <span className="flex items-center gap-1"><Check size={11} /> {draftPoints.length} points — ready to save</span>}
                </div>

                {/* Circle radius */}
                {drawType === 'circle' && draftCenter && (
                  <div className="form-field">
                    <label className="form-label">Radius</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={50}
                        max={50000}
                        step={50}
                        value={draftRadius}
                        onChange={(e) => setDraftRadius(Number(e.target.value))}
                        className="flex-1 accent-primary-600"
                      />
                      <span className="text-xs font-mono text-slate-600 w-16 text-right">{fmtRadius(draftRadius)}</span>
                    </div>
                  </div>
                )}

                {/* Polygon point controls */}
                {drawType === 'polygon' && draftPoints.length > 0 && (
                  <button
                    type="button"
                    className="btn btn--ghost text-xs py-1"
                    onClick={() => setDraftPoints((p) => p.slice(0, -1))}
                  >
                    Undo last point
                  </button>
                )}

                {/* Form fields */}
                <form id="fence-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="form-field mb-3">
                    <label className="form-label">Name <span className="text-red-500">*</span></label>
                    <input
                      className={`form-input${errors.name ? ' form-input--error' : ''}`}
                      placeholder="e.g. Warehouse Zone A"
                      {...register('name')}
                    />
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>

                  <div className="form-field mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={2} {...register('description')} />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Assigned Devices</label>
                    <div className="border border-slate-200 rounded-lg max-h-36 overflow-y-auto divide-y divide-slate-100">
                      {devices.length === 0 ? (
                        <p className="text-xs text-slate-400 p-2">No devices available</p>
                      ) : devices.map((d) => (
                        <label key={d.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" value={d.id} {...register('assignedDeviceIds')} className="accent-primary-600" />
                          <span className="text-xs text-slate-700 truncate">{d.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-auto flex-shrink-0">{d.imei.slice(-6)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-slate-100 flex gap-2">
                <button type="button" className="btn btn--ghost flex-1" onClick={cancelForm}>Cancel</button>
                <button
                  type="submit"
                  form="fence-form"
                  className="btn btn--primary flex-1"
                  disabled={isPending || !geometryReady}
                >
                  {isPending ? 'Saving…' : pageMode === 'edit' ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Map */}
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200">
          {drawMode !== 'none' && (
            <div className="absolute z-[1000] top-2 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
              Drawing mode: {TYPE_LABEL[drawType]} — click on map
            </div>
          )}
          <GeofenceMapPanel
            fences={fences}
            selectedId={selectedId}
            drawMode={drawMode}
            draftCenter={draftCenter}
            draftRadius={draftRadius}
            draftPoints={draftPoints}
            onMapClick={handleMapClick}
          />
        </div>
      </div>
    </div>
  );
}

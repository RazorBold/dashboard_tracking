import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Link, Unlink } from 'lucide-react';
import type { Vehicle, VehicleFormValues } from '../../types/vehicle';
import type { Device } from '../../types/device';

const schema = z.object({
  plateNo: z.string().min(1, 'Plate No is required').max(20),
  type: z.enum(['car', 'motorcycle', 'truck', 'bus', 'van', 'other']).optional(),
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  maxSpeed: z.coerce.number().int().positive().optional().or(z.literal('')),
  vin: z.string().max(17).optional(),
  sn: z.string().max(30).optional(),
  ownerName: z.string().max(100).optional(),
  ownerPhone: z.string().max(20).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired']).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  vehicle?: Vehicle;
  devices: Device[];
  onClose: () => void;
  onSubmit: (values: VehicleFormValues) => void;
  onBindDevice?: (deviceId: string) => void;
  onUnbindDevice?: () => void;
}

export function VehicleFormModal({ open, vehicle, devices, onClose, onSubmit, onBindDevice, onUnbindDevice }: Props) {
  const isEdit = Boolean(vehicle);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset({
        plateNo: vehicle?.plateNo ?? '',
        type: vehicle?.type ?? undefined,
        make: vehicle?.make ?? '',
        model: vehicle?.model ?? '',
        maxSpeed: vehicle?.maxSpeed ?? ('' as any),
        vin: vehicle?.vin ?? '',
        sn: vehicle?.sn ?? '',
        ownerName: vehicle?.ownerName ?? '',
        ownerPhone: vehicle?.ownerPhone ?? '',
        status: vehicle?.status ?? 'active',
      });
    }
  }, [open, vehicle, reset]);

  if (!open) return null;

  const submit = (values: FormValues) => {
    const payload: VehicleFormValues = {
      ...values,
      maxSpeed: values.maxSpeed === '' ? undefined : Number(values.maxSpeed),
    };
    onSubmit(payload);
  };

  const boundDevice = vehicle?.deviceId
    ? devices.find((d) => d.id === vehicle.deviceId)
    : undefined;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal modal--lg">
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <button className="modal__close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="modal__body" onSubmit={handleSubmit(submit)} noValidate>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="form-field">
              <label className="form-label">Plate No <span className="text-red-500">*</span></label>
              <input
                disabled={isEdit}
                className={`form-input${errors.plateNo ? ' form-input--error' : ''}${isEdit ? ' opacity-60' : ''}`}
                {...register('plateNo')}
              />
              {errors.plateNo && <p className="form-error">{errors.plateNo.message}</p>}
            </div>

            <div className="form-field">
              <label className="form-label">Type</label>
              <select className="form-input" {...register('type')}>
                <option value="">— Select type —</option>
                {(['car', 'motorcycle', 'truck', 'bus', 'van', 'other'] as const).map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Make</label>
              <input className="form-input" placeholder="e.g. Toyota" {...register('make')} />
            </div>

            <div className="form-field">
              <label className="form-label">Model</label>
              <input className="form-input" placeholder="e.g. Avanza" {...register('model')} />
            </div>

            <div className="form-field">
              <label className="form-label">Max Speed (km/h)</label>
              <input type="number" className="form-input" min={1} {...register('maxSpeed')} />
            </div>

            <div className="form-field">
              <label className="form-label">VIN</label>
              <input className="form-input" maxLength={17} {...register('vin')} />
            </div>

            <div className="form-field">
              <label className="form-label">Serial No</label>
              <input className="form-input" {...register('sn')} />
            </div>

            <div className="form-field">
              <label className="form-label">Owner Name</label>
              <input className="form-input" {...register('ownerName')} />
            </div>

            <div className="form-field">
              <label className="form-label">Owner Phone</label>
              <input className="form-input" {...register('ownerPhone')} />
            </div>

            <div className="form-field">
              <label className="form-label">Status</label>
              <select className="form-input" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          {/* Device binding — edit mode only */}
          {isEdit && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Device Binding</h4>
              {boundDevice ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-emerald-800">{boundDevice.name}</p>
                    <p className="text-[10px] font-mono text-emerald-600">{boundDevice.imei}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onUnbindDevice}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    <Unlink size={12} /> Unbind
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    id="bind-device-select"
                    className="form-input flex-1"
                    defaultValue=""
                  >
                    <option value="">— Select device to bind —</option>
                    {devices
                      .filter((d) => !d.id)
                      .concat(devices)
                      .filter((d, idx, arr) => arr.findIndex(x => x.id === d.id) === idx)
                      .map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.imei})</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById('bind-device-select') as HTMLSelectElement;
                      if (sel.value && onBindDevice) onBindDevice(sel.value);
                    }}
                    className="btn btn--ghost flex items-center gap-1 text-xs"
                  >
                    <Link size={12} /> Bind
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

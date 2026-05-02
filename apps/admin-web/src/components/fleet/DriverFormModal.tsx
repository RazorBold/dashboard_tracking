import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { Driver, DriverFormValues } from '../../types/driver';

const baseSchema = z.object({
  driverNo: z.string().min(1, 'Driver No is required').max(30),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional(),
  licenseNo: z.string().max(30).optional(),
  rfidCardNo: z.string().max(30).optional(),
  kc208: z.string().max(30).optional(),
  registerPlace: z.string().max(100).optional(),
  registerDate: z.string().optional(),
  licenseExpiry: z.string().optional(),
  fleetName: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

type FormValues = z.infer<typeof baseSchema>;

interface Props {
  open: boolean;
  driver?: Driver;
  onClose: () => void;
  onSubmit: (values: DriverFormValues) => void;
}

function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function DriverFormModal({ open, driver, onClose, onSubmit }: Props) {
  const isEdit = Boolean(driver);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        driverNo: driver?.driverNo ?? '',
        name: driver?.name ?? '',
        phone: driver?.phone ?? '',
        licenseNo: driver?.licenseNo ?? '',
        rfidCardNo: driver?.rfidCardNo ?? '',
        kc208: driver?.kc208 ?? '',
        registerPlace: driver?.registerPlace ?? '',
        registerDate: toDateInput(driver?.registerDate),
        licenseExpiry: toDateInput(driver?.licenseExpiry),
        fleetName: driver?.fleetName ?? '',
        status: driver?.status ?? 'active',
      });
    }
  }, [open, driver, reset]);

  if (!open) return null;

  const submit = (values: FormValues) => {
    const payload: DriverFormValues = {
      ...values,
      registerDate: values.registerDate ? new Date(values.registerDate).toISOString() : undefined,
      licenseExpiry: values.licenseExpiry ? new Date(values.licenseExpiry).toISOString() : undefined,
    };
    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal modal--lg">
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Edit Driver' : 'Add Driver'}</h2>
          <button className="modal__close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="modal__body" onSubmit={handleSubmit(submit)} noValidate>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="form-field">
              <label className="form-label">Driver No <span className="text-red-500">*</span></label>
              <input
                disabled={isEdit}
                className={`form-input${errors.driverNo ? ' form-input--error' : ''}${isEdit ? ' opacity-60' : ''}`}
                {...register('driverNo')}
              />
              {errors.driverNo && <p className="form-error">{errors.driverNo.message}</p>}
            </div>

            <div className="form-field">
              <label className="form-label">Full Name <span className="text-red-500">*</span></label>
              <input
                className={`form-input${errors.name ? ' form-input--error' : ''}`}
                {...register('name')}
              />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div className="form-field">
              <label className="form-label">Phone</label>
              <input className="form-input" {...register('phone')} />
            </div>

            <div className="form-field">
              <label className="form-label">License No</label>
              <input className="form-input" {...register('licenseNo')} />
            </div>

            <div className="form-field">
              <label className="form-label">License Expiry</label>
              <input type="date" className="form-input" {...register('licenseExpiry')} />
            </div>

            <div className="form-field">
              <label className="form-label">RFID Card No</label>
              <input className="form-input" {...register('rfidCardNo')} />
            </div>

            <div className="form-field">
              <label className="form-label">KC208</label>
              <input className="form-input" {...register('kc208')} />
            </div>

            <div className="form-field">
              <label className="form-label">Register Place</label>
              <input className="form-input" {...register('registerPlace')} />
            </div>

            <div className="form-field">
              <label className="form-label">Register Date</label>
              <input type="date" className="form-input" {...register('registerDate')} />
            </div>

            <div className="form-field">
              <label className="form-label">Fleet Name</label>
              <input className="form-input" {...register('fleetName')} />
            </div>

            <div className="form-field">
              <label className="form-label">Status</label>
              <select className="form-input" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

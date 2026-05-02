import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { Device } from '../../types/device';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  imei: z
    .string()
    .min(15, 'IMEI must be at least 15 digits')
    .max(17)
    .regex(/^\d+$/, 'IMEI must contain digits only'),
  model: z.string().max(50).optional(),
});

const editSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  imei: z.string(),
  model: z.string().max(50).optional(),
});

type FormValues = z.infer<typeof createSchema>;

export interface DeviceFormValues {
  name: string;
  imei?: string;
  model?: string;
}

interface Props {
  open: boolean;
  device?: Device;
  onClose: () => void;
  onSubmit: (values: DeviceFormValues) => void;
}

export function DeviceFormModal({ open, device, onClose, onSubmit }: Props) {
  const isEdit = Boolean(device);
  const schema = isEdit ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        name: device?.name ?? '',
        imei: device?.imei ?? '',
        model: device?.model ?? '',
      });
    }
  }, [open, device, reset]);

  if (!open) return null;

  const submit = (values: FormValues) => {
    if (isEdit) {
      const { imei: _imei, ...rest } = values;
      onSubmit(rest);
    } else {
      onSubmit(values);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Edit Device' : 'Add Device'}</h2>
          <button className="modal__close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="modal__body" onSubmit={handleSubmit(submit)} noValidate>
          <div className="form-field">
            <label htmlFor="device-name" className="form-label">Name</label>
            <input
              id="device-name"
              aria-label="Name"
              className={`form-input${errors.name ? ' form-input--error' : ''}`}
              {...register('name')}
            />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="device-imei" className="form-label">IMEI</label>
            <input
              id="device-imei"
              aria-label="IMEI"
              disabled={isEdit}
              className={`form-input${errors.imei ? ' form-input--error' : ''}`}
              {...register('imei')}
            />
            {errors.imei && <p className="form-error">{errors.imei.message}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="device-model" className="form-label">Model</label>
            <input
              id="device-model"
              aria-label="Model"
              className="form-input"
              {...register('model')}
            />
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

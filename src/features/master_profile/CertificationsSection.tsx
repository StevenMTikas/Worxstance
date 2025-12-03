import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { MasterProfileFormData } from './schemas';

const CertificationsSection: React.FC = () => {
  const { register, control, formState: { errors } } = useFormContext<MasterProfileFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "certifications"
  });

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Certifications</h3>
        <button
          type="button"
          onClick={() => append({
            id: crypto.randomUUID(),
            name: '',
            issuer: '',
            date: ''
          })}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </button>
      </div>

      {fields.length === 0 && (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
          No certifications added yet. Click "Add Certification" to start.
        </div>
      )}

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-6 bg-slate-50 border border-slate-200 rounded-xl relative group">
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remove certification"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Certification Name *</label>
                <input
                  {...register(`certifications.${index}.name`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="e.g. AWS Certified Solutions Architect"
                />
                {errors.certifications?.[index]?.name && (
                  <p className="text-xs text-rose-500">{errors.certifications[index]?.name?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Issuer *</label>
                <input
                  {...register(`certifications.${index}.issuer`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="e.g. Amazon Web Services, Google Cloud"
                />
                {errors.certifications?.[index]?.issuer && (
                  <p className="text-xs text-rose-500">{errors.certifications[index]?.issuer?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Date Obtained *</label>
                <input
                  type="date"
                  {...register(`certifications.${index}.date`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
                {errors.certifications?.[index]?.date && (
                  <p className="text-xs text-rose-500">{errors.certifications[index]?.date?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Expiry Date</label>
                <input
                  type="date"
                  {...register(`certifications.${index}.expiryDate`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Certification URL</label>
                <input
                  type="url"
                  {...register(`certifications.${index}.url`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="https://www.credly.com/badges/..."
                />
                {errors.certifications?.[index]?.url && (
                  <p className="text-xs text-rose-500">{errors.certifications[index]?.url?.message}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificationsSection;


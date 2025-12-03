import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { MasterProfileFormData } from './schemas';

const ExperienceSection: React.FC = () => {
  const { register, control, formState: { errors } } = useFormContext<MasterProfileFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "experience"
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Experience</h3>
        <button
          type="button"
          onClick={() => append({
            id: crypto.randomUUID(),
            company: '',
            role: '',
            startDate: '',
            achievements: []
          })}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Position
        </button>
      </div>

      {fields.length === 0 && (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
          No experience added yet. Click "Add Position" to start.
        </div>
      )}

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remove position"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Company *</label>
                <input
                  {...register(`experience.${index}.company`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Google"
                />
                {errors.experience?.[index]?.company && (
                  <p className="text-xs text-rose-500">{errors.experience[index]?.company?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Role *</label>
                <input
                  {...register(`experience.${index}.role`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Senior Product Manager"
                />
                {errors.experience?.[index]?.role && (
                  <p className="text-xs text-rose-500">{errors.experience[index]?.role?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Start Date *</label>
                <input
                  type="date"
                  {...register(`experience.${index}.startDate`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.experience?.[index]?.startDate && (
                  <p className="text-xs text-rose-500">{errors.experience[index]?.startDate?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">End Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    {...register(`experience.${index}.endDate`)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {/* TODO: Add 'Present' checkbox logic */}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Key Achievements</label>
              <textarea
                {...register(`experience.${index}.description`)}
                rows={4}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your impact..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceSection;


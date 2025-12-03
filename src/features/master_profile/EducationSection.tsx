import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { MasterProfileFormData } from './schemas';

const EducationSection: React.FC = () => {
  const { register, control, formState: { errors } } = useFormContext<MasterProfileFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "education"
  });

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Education</h3>
        <button
          type="button"
          onClick={() => append({
            id: crypto.randomUUID(),
            institution: '',
            degree: '',
            graduationDate: ''
          })}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </button>
      </div>

      {fields.length === 0 && (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
          No education added yet. Click "Add Education" to start.
        </div>
      )}

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-6 bg-slate-50 border border-slate-200 rounded-xl relative group">
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remove education"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Institution *</label>
                <input
                  {...register(`education.${index}.institution`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="e.g. MIT, Stanford University"
                />
                {errors.education?.[index]?.institution && (
                  <p className="text-xs text-rose-500">{errors.education[index]?.institution?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Degree *</label>
                <input
                  {...register(`education.${index}.degree`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="e.g. Bachelor of Science, Master of Arts"
                />
                {errors.education?.[index]?.degree && (
                  <p className="text-xs text-rose-500">{errors.education[index]?.degree?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Field of Study</label>
                <input
                  {...register(`education.${index}.fieldOfStudy`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="e.g. Computer Science, Business Administration"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Graduation Date *</label>
                <input
                  type="date"
                  {...register(`education.${index}.graduationDate`)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
                {errors.education?.[index]?.graduationDate && (
                  <p className="text-xs text-rose-500">{errors.education[index]?.graduationDate?.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                {...register(`education.${index}.description`)}
                rows={3}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder="Relevant coursework, honors, GPA, etc."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationSection;


import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import type { MasterProfileFormData } from './schemas';

const SkillsSection: React.FC = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<MasterProfileFormData>();
  const [newSkill, setNewSkill] = useState('');
  const skills = watch('skills') || [];

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setValue('skills', [...skills, newSkill.trim()], { shouldValidate: true });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    setValue('skills', updated, { shouldValidate: true });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Skills</h3>
        <p className="text-sm text-slate-600 mb-4">
          Add your technical and professional skills. These will be used for job matching and resume tailoring.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. Python, React, Project Management"
          />
          <button
            type="button"
            onClick={addSkill}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </button>
        </div>

        {skills.length === 0 && (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
            No skills added yet. Add your first skill above.
          </div>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200"
              >
                <span className="text-sm font-medium">{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-indigo-400 hover:text-indigo-600 transition-colors"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden input for form validation */}
      <input
        type="hidden"
        {...register('skills')}
      />
      {errors.skills && (
        <p className="text-xs text-rose-500">{errors.skills.message}</p>
      )}
    </div>
  );
};

export default SkillsSection;


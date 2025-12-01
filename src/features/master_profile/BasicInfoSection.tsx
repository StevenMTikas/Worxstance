import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { MasterProfileFormData } from './schemas';

const BasicInfoSection: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<MasterProfileFormData>();

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Full Name *</label>
          <input
            {...register('fullName')}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="John Doe"
          />
          {errors.fullName && (
            <p className="text-xs text-rose-500">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Headline</label>
          <input
            {...register('headline')}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Product Manager | ex-Google"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Email *</label>
          <input
            {...register('email')}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="text-xs text-rose-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Phone</label>
          <input
            {...register('phone')}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Location</label>
          <input
            {...register('location')}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="New York, NY"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">LinkedIn URL</label>
          <input
            {...register('linkedinUrl')}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://linkedin.com/in/..."
          />
           {errors.linkedinUrl && (
            <p className="text-xs text-rose-500">{errors.linkedinUrl.message}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Professional Summary</label>
        <textarea
          {...register('summary')}
          rows={4}
          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Briefly describe your professional background and goals..."
        />
      </div>
    </div>
  );
};

export default BasicInfoSection;


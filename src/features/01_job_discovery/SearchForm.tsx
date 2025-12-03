import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { JobDiscoverySearchSchema, type JobDiscoverySearchData } from './schemas';

interface SearchFormProps {
  onSearch: (data: JobDiscoverySearchData) => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<JobDiscoverySearchData>({
    resolver: zodResolver(JobDiscoverySearchSchema) as any,
    defaultValues: {
      isRemote: false,
      experienceLevel: 'mid'
    }
  });

  const onSubmit: SubmitHandler<JobDiscoverySearchData> = (data) => {
    onSearch(data);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-0 md:flex md:items-end md:gap-4">
        
        {/* Role Input */}
        <div className="flex-1 space-y-1">
          <label htmlFor="role" className="block text-sm font-medium text-slate-700">Target Role</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Briefcase className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="role"
              {...register('role')}
              type="text"
              className="pl-10 block w-full rounded-lg border-slate-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Product Manager"
            />
          </div>
          {errors.role && <p className="text-xs text-rose-500">{errors.role.message}</p>}
        </div>

        {/* Location Input */}
        <div className="flex-1 space-y-1">
          <label htmlFor="location" className="block text-sm font-medium text-slate-700">Location</label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="location"
              {...register('location')}
              type="text"
              className="pl-10 block w-full rounded-lg border-slate-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. New York, NY"
            />
          </div>
          {errors.location && <p className="text-xs text-rose-500">{errors.location.message}</p>}
        </div>

        {/* Remote Toggle */}
        <div className="flex items-center h-12 pb-2">
           <label className="flex items-center space-x-2 cursor-pointer">
             <input 
               type="checkbox" 
               {...register('isRemote')}
               className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
             />
             <span className="text-sm text-slate-700 font-medium">Remote Only</span>
           </label>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`h-11 px-6 flex items-center justify-center rounded-lg text-white font-medium transition-colors shadow-sm
            ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Find Jobs
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;


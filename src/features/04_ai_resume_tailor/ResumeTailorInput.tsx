import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, ArrowRight } from 'lucide-react';
import { ResumeTailorInputSchema, type ResumeTailorInputData } from './schemas';
import { useMasterProfile } from '../../contexts/MasterProfileContext';

interface ResumeTailorInputProps {
  onAnalyze: (data: ResumeTailorInputData) => void;
  isAnalyzing: boolean;
}

const ResumeTailorInput: React.FC<ResumeTailorInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const { profile } = useMasterProfile();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid } 
  } = useForm<ResumeTailorInputData>({
    resolver: zodResolver(ResumeTailorInputSchema),
    mode: 'onChange'
  });

  const onSubmit: SubmitHandler<ResumeTailorInputData> = (data) => {
    onAnalyze(data);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Step 1: Input Job Details
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Paste the job description you want to target. We'll optimize your profile to match it.
        </p>
      </div>

      <div className="p-6 grid md:grid-cols-3 gap-8">
        {/* Left Col: Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <label htmlFor="targetRole" className="block text-sm font-medium text-slate-700">
              Target Role Title (Optional)
            </label>
            <input
              id="targetRole"
              {...register('targetRole')}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Senior Frontend Engineer"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="jobDescription" className="block text-sm font-medium text-slate-700">
              Job Description Text *
            </label>
            <textarea
              id="jobDescription"
              {...register('jobDescription')}
              rows={12}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder="Paste the full job description here..."
            />
            {errors.jobDescription && (
              <p className="text-sm text-rose-500 mt-1">{errors.jobDescription.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isAnalyzing}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-white transition-all
              ${!isValid || isAnalyzing 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing Match...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Analyze & Tailor Resume <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Right Col: Context/Preview */}
        <div className="hidden md:block border-l border-slate-100 pl-8">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
            Source Profile
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Acting As</p>
              <p className="font-medium text-slate-900 truncate">
                {profile?.fullName || 'Guest User'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {profile?.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">Ready to Optimize:</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profile?.experience?.length ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {profile?.experience?.length || 0} Experience Entries
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profile?.education?.length ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {profile?.education?.length || 0} Education Entries
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profile?.skills?.length ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {profile?.skills?.length || 0} Skills Listed
                </li>
              </ul>
            </div>

            {!profile && (
              <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                Warning: No Master Profile found. Results will be generic.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeTailorInput;


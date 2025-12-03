import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MasterProfileSchema, type MasterProfileFormData } from '../features/master_profile/schemas';
import BasicInfoSection from '../features/master_profile/BasicInfoSection';
import ExperienceSection from '../features/master_profile/ExperienceSection';
import EducationSection from '../features/master_profile/EducationSection';
import CertificationsSection from '../features/master_profile/CertificationsSection';
import SkillsSection from '../features/master_profile/SkillsSection';
import { useAuth } from '../contexts/AuthContext';
import { useMasterProfile } from '../contexts/MasterProfileContext';

const MasterProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile, loading: contextLoading } = useMasterProfile();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  const methods = useForm<MasterProfileFormData>({
    resolver: zodResolver(MasterProfileSchema) as any,
    defaultValues: {
      id: user?.uid || '',
      fullName: '',
      email: user?.email || '',
      headline: '',
      location: '',
      phone: '',
      website: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
      summary: '',
      experience: [],
      education: [],
      skills: [],
      targetRoles: [],
      certifications: [],
      lastUpdated: new Date().toISOString()
    }
  });

  // Load existing profile data into form when available
  useEffect(() => {
    if (profile) {
      methods.reset(profile);
    } else if (user?.email) {
      methods.setValue('email', user.email);
    }
  }, [profile, user, methods]);

  const onSubmit = async (data: MasterProfileFormData) => {
    setSaveStatus('saving');
    
    // Safety timeout - clear loading state after 10 seconds
    const timeoutId = setTimeout(() => {
      console.warn('Save operation taking longer than expected');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }, 10000);
    
    try {
      const updatedProfile = {
        ...data,
        id: user?.uid || '', // Ensure ID is set
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Saving profile:', updatedProfile);
      await updateProfile(updatedProfile);
      console.log('Profile saved successfully');
      
      clearTimeout(timeoutId);
      setSaveStatus('success');
      
      // Reset success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      clearTimeout(timeoutId);
      setSaveStatus('error');
      // Reset error state after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link to="/" className="text-slate-500 hover:text-slate-800 transition-colors">
               &larr; Dashboard
             </Link>
             <h1 className="text-xl font-semibold text-slate-900">Edit Master Profile</h1>
           </div>
           
           <div className="flex items-center gap-3">
             {saveStatus === 'success' && (
                <span className="text-emerald-600 text-sm font-medium flex items-center animate-fade-in">
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Saved
                </span>
             )}
             {saveStatus === 'error' && (
                <span className="text-rose-600 text-sm font-medium flex items-center animate-fade-in">
                  <AlertCircle className="w-4 h-4 mr-1.5" />
                  Failed to save
                </span>
             )}

             <button
               onClick={methods.handleSubmit(onSubmit)}
               disabled={saveStatus === 'saving' || contextLoading}
               className={`flex items-center px-4 py-2 text-white font-medium rounded-lg transition-colors shadow-sm ${
                 saveStatus === 'saving' ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
               }`}
             >
               <Save className="w-4 h-4 mr-2" />
               {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
             </button>
           </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
            <BasicInfoSection />
            <ExperienceSection />
            <EducationSection />
            <CertificationsSection />
            <SkillsSection />
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default MasterProfilePage;

import React from 'react';

const MasterProfilePage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Master Profile</h1>
      <p className="mt-2 text-sm text-slate-600">
        Edit and maintain your core profile data here. Other Worxstance tools will pull from this
        source of truth.
      </p>
    </div>
  );
};

export default MasterProfilePage;



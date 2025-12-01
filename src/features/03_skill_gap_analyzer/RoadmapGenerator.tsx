import React from 'react';
import type { SkillGapAnalysisOutput } from './schemas';

interface RoadmapGeneratorProps {
  roadmap: SkillGapAnalysisOutput['roadmap'];
}

const RoadmapGenerator: React.FC<RoadmapGeneratorProps> = ({ roadmap }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
        <span className="bg-blue-100 text-blue-700 p-2 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" />
          </svg>
        </span>
        Personalized Learning Roadmap
      </h3>
      
      {roadmap.length === 0 ? (
        <p className="text-slate-500">No specific roadmap steps generated.</p>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
          {roadmap.map((step, index) => (
            <div key={index} className="relative pl-8">
              {/* Timeline Dot */}
              <div className="absolute -left-[9px] top-0 bg-white border-2 border-blue-500 rounded-full h-4 w-4"></div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-900 text-lg">{step.title}</h4>
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {step.estimatedTime}
                  </span>
                </div>
                
                <p className="text-slate-700 mb-3">{step.description}</p>
                
                {step.resourceUrl && (
                  <a 
                    href={step.resourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Resource
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                
                <div className="mt-2 text-xs text-slate-400 capitalize">
                  Priority: {step.priority}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoadmapGenerator;

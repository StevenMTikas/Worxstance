import { MasterProfile } from '../lib/types';
import { ResumeTailorResponse } from '../features/04_ai_resume_tailor/geminiSchema';

export const generateMarkdown = (profile: MasterProfile, result: ResumeTailorResponse): string => {
  const { fullName, email, phone, location, linkedinUrl, education, skills } = profile;
  const { optimizedSummary, optimizedExperience, optimizedSkills } = result;

  let md = `# ${fullName}\n`;
  md += `${email} | ${phone || ''} | ${location || ''}\n`;
  if (linkedinUrl) md += `${linkedinUrl}\n`;
  md += `\n---\n\n`;

  // Summary
  md += `## Professional Summary\n\n`;
  md += `${optimizedSummary}\n\n`;

  // Experience
  md += `## Professional Experience\n\n`;
  
  // We iterate through the OPTIMIZED experience list
  optimizedExperience.forEach(exp => {
    // Find original details for dates (assuming dates weren't optimized/changed)
    const original = profile.experience.find(e => e.id === exp.id);
    const dateRange = original ? `${original.startDate} - ${original.endDate || 'Present'}` : '';

    md += `### ${exp.role}\n`;
    md += `**${exp.company}** | ${dateRange}\n\n`;
    
    exp.optimizedAchievements.forEach(bullet => {
      md += `- ${bullet}\n`;
    });
    md += `\n`;
  });

  // Education
  if (education && education.length > 0) {
    md += `## Education\n\n`;
    education.forEach(edu => {
      md += `**${edu.institution}**\n`;
      md += `${edu.degree}, ${edu.fieldOfStudy || ''} | ${edu.graduationDate}\n\n`;
    });
  }

  // Skills
  // Combine original skills and optimized ones, removing duplicates
  const allSkills = Array.from(new Set([...skills, ...optimizedSkills]));
  if (allSkills.length > 0) {
    md += `## Skills\n\n`;
    md += `${allSkills.join(' • ')}\n`;
  }

  return md;
};


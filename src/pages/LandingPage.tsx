import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo-section">
            <img 
              src="/images/worxstance_logo.png" 
              alt="Worxstance" 
              className="logo-img" 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const next = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                if (next) next.style.marginLeft = '0';
              }}
            />
            <span className="logo-text">Worxstance</span>
          </Link>
          
          <nav>
            <ul className="nav-menu">
              <li><a href="#tools" className="nav-link">Tools</a></li>
              <li><a href="#playbook" className="nav-link">Playbook</a></li>
              <li><a href="#pricing" className="nav-link">Pricing</a></li>
              <li><a href="#resources" className="nav-link">Resources</a></li>
            </ul>
          </nav>

          <div className="login-section">
            <Link to="/login" className="login-button">
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section>
          <div>
            <div className="w-full">
              <img 
                src="/images/hero-image.png" 
                alt="Professional team on rooftop overlooking city skyline" 
                className="w-full h-auto object-cover max-h-[60vh]"
                loading="eager"
              />
            </div>
            <div className="max-w-4xl mx-auto px-6 py-12">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                  Own your job search with one AI workspace
                </h1>
                <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                  Stop juggling spreadsheets and scattered tools. Worxstance brings together everything you need—from job discovery to offer negotiation—powered by AI that understands your career goals.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Link 
                    to="/login" 
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors min-w-[200px] text-center"
                  >
                    Get Started
                  </Link>
                  <a 
                    href="#tools" 
                    className="bg-transparent text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-600 hover:text-white transition-colors min-w-[200px] text-center"
                  >
                    See The Platform
                  </a>
                </div>
                <ul className="flex flex-col gap-4 text-left max-w-lg mx-auto">
                  <li className="flex items-center gap-3 text-slate-700">
                    <span className="text-indigo-600 font-bold text-xl">✓</span>
                    <span>AI-powered job matching tailored to your profile</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <span className="text-indigo-600 font-bold text-xl">✓</span>
                    <span>Strategic networking and outreach automation</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-700">
                    <span className="text-indigo-600 font-bold text-xl">✓</span>
                    <span>Interview prep and negotiation support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section className="bg-slate-50 py-16 px-4 md:px-6" id="tools">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-center text-3xl md:text-4xl font-bold text-slate-900 mb-12">
              Everything you need to land your next role
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Row 1 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <img 
                  src="/images/job-discovery.png" 
                  alt="AI Job Discovery tool" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Job Discovery</h3>
                <p className="text-sm text-slate-600">
                  AI-powered job search and matching that finds opportunities aligned with your skills and career goals.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <img 
                  src="/images/networking-crm.png" 
                  alt="Networking CRM tool" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Networking CRM</h3>
                <p className="text-sm text-slate-600">
                  Strategic outreach manager to build and maintain professional relationships that open doors to opportunities.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <img 
                  src="/images/skill-gap-analyzer.png" 
                  alt="Skill Gap Analyzer tool" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Skill Gap Analyzer</h3>
                <p className="text-sm text-slate-600">
                  Identify the skills you need to develop to land your target role and create a personalized learning plan.
                </p>
              </div>
              
              {/* Row 2 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <img 
                  src="/images/resume-tailor.png" 
                  alt="AI Resume Tailor tool" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Resume Tailor</h3>
                <p className="text-sm text-slate-600">
                  Instantly customize your resume for each application, highlighting the most relevant experience and skills.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <img 
                  src="/images/cover-letter-generator.png" 
                  alt="AI Cover Letter Generator tool" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Cover Letter Generator</h3>
                <p className="text-sm text-slate-600">
                  Generate personalized, compelling cover letters that connect your experience to each role's requirements.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <img 
                  src="/images/star-story-builder.png" 
                  alt="STAR Story Builder tool" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">STAR Story Builder</h3>
                <p className="text-sm text-slate-600">
                  Behavioral interview prep tool that helps you craft compelling STAR stories for common interview questions.
                </p>
              </div>
              
              {/* Row 3 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <img 
                  src="/images/mock-interview-simulator.png" 
                  alt="Mock Interview Simulator tool" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Mock Interview Simulator</h3>
                <p className="text-sm text-slate-600">
                  Practice interviews with AI-powered feedback to build confidence and refine your responses before the real thing.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <img 
                  src="/images/follow-up-manager.png" 
                  alt="Follow-Up Manager tool" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Follow-Up Manager</h3>
                <p className="text-sm text-slate-600">
                  Post-interview CRM to track conversations, send timely follow-ups, and stay organized throughout the process.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <img 
                  src="/images/offer-negotiator.png" 
                  alt="Offer Negotiator tool" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Offer Negotiator</h3>
                <p className="text-sm text-slate-600">
                  Calculate total compensation, prepare negotiation scripts, and maximize your offer with confidence.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <p>Registered 2025</p>
            <a 
              href="#" 
              className="text-indigo-600 hover:text-indigo-700 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


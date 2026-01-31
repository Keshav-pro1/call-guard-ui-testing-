
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout, selectedRegion, setSelectedRegion, userProfile } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled
        ? 'bg-black/40 backdrop-blur-xl py-4 border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.1)]'
        : 'bg-transparent py-8 border-b border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-medium tracking-widest text-white">CallGuard</span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {[
            { name: 'Deliverables', path: '/services' },
            
            { name: 'Long Calls', path: '/long-calls' },
            { name: 'Analysis', path: '/analysis' },
            { name: 'SOP Manager', path: '/sop-manager' },
            { name: 'Coaching', path: '/coaching' },
            { name: 'Contact', path: '/contact' }
          ].map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 hover:text-white transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>


        <div className="flex items-center gap-6">
          {currentUser ? (
            <div className="hidden sm:flex items-center gap-4">
              {/* Region Selector */}
              {userProfile?.branches && userProfile.branches.length > 0 && (
                <div className="relative group">
                  <select
                    value={selectedRegion || ''}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="bg-transparent text-[10px] uppercase tracking-widest text-white border border-white/20 rounded px-2 py-1 outline-none hover:border-white transition-colors cursor-pointer appearance-none"
                    style={{ textAlignLast: 'center' }}
                  >
                    {userProfile.branches.map(branch => (
                      <option key={branch} value={branch} className="bg-black text-white">
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <span className="text-[10px] uppercase tracking-widest text-gray-400">{currentUser.email?.split('@')[0]}</span>
              <button
                onClick={() => logout()}
                className="text-[10px] uppercase tracking-widest font-bold border-1 border-white/20 px-3 py-1 rounded hover:bg-white/10 transition-all text-white"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:block text-[10px] uppercase tracking-widest font-bold border-b border-white pb-1 hover:text-gray-400 hover:border-gray-400 transition-all text-white"
            >
              Log In
            </Link>
          )}

          <button
            className="p-2 md:hidden text-white relative z-50"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black z-40 md:hidden transition-all duration-500 overflow-hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {[
            { name: 'Deliverables', path: '/services' },
            { name: 'Evaluation', path: '/services#evaluation' },
            { name: 'Long Calls', path: '/long-calls' },
            { name: 'Analysis', path: '/analysis' },
            { name: 'SOP Manager', path: '/sop-manager' },
            { name: 'Coaching', path: '/coaching' },
            { name: 'Contact', path: '/contact' }
          ].map((item, idx) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-2xl uppercase tracking-[0.2em] font-light text-white transition-all duration-700 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              {item.name}
            </Link>
          ))}
          {currentUser ? (
            <button
              onClick={() => logout()}
              className={`mt-8 px-10 py-4 border border-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-700 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: '400ms' }}
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className={`mt-8 px-10 py-4 border border-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-700 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: '400ms' }}
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
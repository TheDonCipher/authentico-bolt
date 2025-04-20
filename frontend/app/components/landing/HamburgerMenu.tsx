import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const HamburgerMenu: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);

  // Close menu when screen size becomes larger than small breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (showMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMenu]);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <>
      <button
        onClick={toggleMenu}
        className="p-2 bg-soft-sage border-2 border-deep-moss shadow-brutal-sm hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all touch-target"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-deep-moss" />
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={toggleMenu}
              aria-hidden="true"
            />

            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed right-0 top-0 bottom-0 z-50 bg-ivory flex flex-col p-4 sm:p-6 overflow-y-auto w-[280px] sm:w-[320px] max-w-[90vw]"
            >
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-deep-moss bg-soft-sage p-2 border-2 sm:border-4 border-deep-moss inline-block">
                  AUTHENTICO
                </h2>
                <button
                  onClick={toggleMenu}
                  className="p-2 bg-burnt-sienna bg-opacity-20 border-2 border-deep-moss shadow-brutal-sm hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all touch-target"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6 text-deep-moss" />
                </button>
              </div>

              <nav className="flex-1">
                <ul className="flex flex-col space-y-3 sm:space-y-4">
                  <li>
                    <a
                      href="#home"
                      onClick={toggleMenu}
                      className="block w-full p-3 sm:p-4 bg-soft-sage border-2 sm:border-4 border-deep-moss font-bold text-deep-moss shadow-brutal-sm sm:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:translate-y-[-2px] transition-all text-center touch-target"
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      href="#guide"
                      onClick={toggleMenu}
                      className="block w-full p-3 sm:p-4 bg-soft-sage border-2 sm:border-4 border-deep-moss font-bold text-deep-moss shadow-brutal-sm sm:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:translate-y-[-2px] transition-all text-center touch-target"
                    >
                      Guide
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      onClick={toggleMenu}
                      className="block w-full p-3 sm:p-4 bg-soft-sage border-2 sm:border-4 border-deep-moss font-bold text-deep-moss shadow-brutal-sm sm:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:translate-y-[-2px] transition-all text-center touch-target"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      onClick={toggleMenu}
                      className="block w-full p-3 sm:p-4 bg-soft-sage border-2 sm:border-4 border-deep-moss font-bold text-deep-moss shadow-brutal-sm sm:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:translate-y-[-2px] transition-all text-center touch-target"
                    >
                      FAQ
                    </a>
                  </li>
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

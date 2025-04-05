import React, { useState } from 'react';
import { Menu } from '../svg';

export const HamburgerMenu: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <>
      <div>
        <button
          onClick={toggleMenu}
          className="p-2 bg-[#f5f5f0] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Menu />
        </button>
      </div>
      {showMenu && (
        <div className="absolute flex flex-col gap-6 text-2xl -left-1 -top-1 p-4 w-screen h-screen bg-[#f5f5f0] border-4 border-black text-black">
          <li className="flex justify-end">
            <button
              onClick={toggleMenu}
              className="px-4 py-2 bg-[#E2725B] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              X
            </button>
          </li>
          <li className="flex justify-center">
            <a href="#home">
              <button
                onClick={toggleMenu}
                className="px-6 py-3 bg-[#8B8589] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Home
              </button>
            </a>
          </li>
          <li className="flex justify-center">
            <a href="#guide">
              <button
                onClick={toggleMenu}
                className="px-6 py-3 bg-[#9CAF88] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Guide
              </button>
            </a>
          </li>
          <li className="flex justify-center">
            <a href="#features">
              <button
                onClick={toggleMenu}
                className="px-6 py-3 bg-[#D6CCA9] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Features
              </button>
            </a>
          </li>
          <li className="flex justify-center">
            <a href="#faq">
              <button
                onClick={toggleMenu}
                className="px-6 py-3 bg-[#8B7355] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                FaQ
              </button>
            </a>
          </li>
        </div>
      )}
    </>
  );
};

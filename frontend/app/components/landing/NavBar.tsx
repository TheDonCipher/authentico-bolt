import React from 'react';
import { HamburgerMenu } from '../landing/HamburgerMenu';

interface INavbar {
  toogleShow: () => void;
  openForm: any;
}

export const NavBar = ({ toogleShow, openForm }: INavbar) => {
  return (
    <nav className="flex justify-evenly fixed top-0 z-50 bg-ivory p-4 rounded gap-2 list-none border-4 border-b-deep-moss w-full shadow-md">
      <div className="flex justify-center items-center">
        <li className="flex justify-center items-center">
          <button className="font-bold text-2xl bg-soft-sage px-4 py-2 border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
            Authentico
          </button>
        </li>
      </div>
      <div className="hidden md:flex gap-7 w-1/2 items-center font-bold list-none justify-evenly">
        <li>
          <a href="#home">
            <button className="bg-soft-sage px-3 py-1 border-2 border-deep-moss shadow-[3px_3px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              Home
            </button>
          </a>
        </li>
        <li>
          <a href="#guide">
            <button className="bg-soft-sage px-3 py-1 border-2 border-deep-moss shadow-[3px_3px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              Guide
            </button>
          </a>
        </li>
        <li>
          <a href="#features">
            <button className="bg-soft-sage px-3 py-1 border-2 border-deep-moss shadow-[3px_3px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              Features
            </button>
          </a>
        </li>
        <li>
          <a href="#faq">
            <button className="bg-soft-sage px-3 py-1 border-2 border-deep-moss shadow-[3px_3px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              FaQ
            </button>
          </a>
        </li>
      </div>
      <div className="flex gap-4 items-center">
        {/* <button
          className="sm:outline-deep-moss outline-2 px-10 py-2 rounded-md outline sm:h-auto h-8 text-sm sm:p-3 bg-forest-green text-ivory font-bold hover:bg-deep-moss transition duration-300"
          onClick={openForm}
        >
          Login
        </button> */}
        <div className="flex justify-center sm:hidden">
          <HamburgerMenu />
        </div>
      </div>
    </nav>
  );
};

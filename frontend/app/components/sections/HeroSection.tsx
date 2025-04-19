import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import reviewng from '../../img/roller-skating.svg';
import sittingreading from '../../img/sitting-reading.svg';

interface HeroSectionProps {
  toogleShow: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ toogleShow }) => (
  <div
    id="home"
    className="bg-[#F0F4F8] p-8 flex flex-col items-center justify-center rounded-lg shadow-lg w-full"
  >
    <div className="flex flex-col gap-6 items-center">
      <div className="text-center">
        <h1 className="font-bold text-4xl sm:text-6xl mb-4">
          Official Document Management
        </h1>
        <h1 className="font-bold text-4xl sm:text-6xl">with Authentico</h1>
      </div>
      <p className="text-center sm:w-3/4 lg:w-1/2 text-lg sm:text-xl">
        Welcome to Authentico, your trusted partner in storing and sharing your
        official documentation. Our cutting-edge AI and blockchain technology
        offers the highest level of accuracy and efficiency in verifying the
        authenticity of your documents to others.
      </p>
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <button
          onClick={toogleShow}
          className="border-black border-2 p-3 bg-[#fef29f] font-bold hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF] rounded-md"
        >
          Get Started 🚀
        </button>
        <Link
          href="/individual-dashboard"
          className="border-black border-2 p-3 bg-[#E5DCC3] font-bold hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF] rounded-md"
        >
          Individual Demo
        </Link>
        <Link
          href="/organization-dashboard"
          className="border-black border-2 p-3 bg-[#E5DCC3] font-bold hover:bg-[#79F7FF] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-[#00E1EF] rounded-md"
        >
          Organization Demo
        </Link>
      </div>
      <div className="flex justify-between w-full mt-10 hidden sm:flex">
        <Image width={323} height={323} src={reviewng} alt="users" />
        <Image width={323} height={323} src={sittingreading} alt="users" />
      </div>
    </div>
  </div>
);

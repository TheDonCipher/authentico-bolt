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
    className="bg-[#F0F4F8] p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center rounded-lg shadow-lg w-full"
  >
    <div className="flex flex-col gap-4 sm:gap-6 items-center max-w-full">
      <div className="text-center px-2 sm:px-4">
        <h1 className="font-bold text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-4 text-deep-moss leading-tight">
          Official Document Management
        </h1>
        <h1 className="font-bold text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-deep-moss leading-tight">
          with Authentico
        </h1>
      </div>
      <p className="text-center sm:w-3/4 lg:w-1/2 text-sm xs:text-base sm:text-lg md:text-xl px-3 sm:px-0 max-w-full">
        Welcome to Authentico, your trusted partner in storing and sharing your
        official documentation. Our cutting-edge AI and blockchain technology
        offers the highest level of accuracy and efficiency in verifying the
        authenticity of your documents to others.
      </p>
      <div className="flex flex-wrap justify-center gap-2 xs:gap-3 sm:gap-4 mt-4 sm:mt-6 w-full px-2 xs:px-4">
        <button
          onClick={toogleShow}
          className="border-deep-moss border-2 p-2 sm:p-3 bg-forest-green text-ivory font-bold hover:bg-deep-moss hover:shadow-brutal-sm active:bg-deep-forest rounded-md touch-target text-sm sm:text-base min-h-[44px] flex items-center justify-center"
        >
          Get Started 🚀
        </button>
        <Link
          href="/individual-dashboard"
          className="border-deep-moss border-2 p-2 sm:p-3 bg-soft-sage text-deep-moss font-bold hover:bg-forest-green hover:text-ivory hover:shadow-brutal-sm active:bg-deep-forest rounded-md touch-target text-sm sm:text-base min-h-[44px] flex items-center justify-center"
        >
          Individual Demo
        </Link>
        <Link
          href="/organization-dashboard"
          className="border-deep-moss border-2 p-2 sm:p-3 bg-soft-sage text-deep-moss font-bold hover:bg-forest-green hover:text-ivory hover:shadow-brutal-sm active:bg-deep-forest rounded-md touch-target text-sm sm:text-base min-h-[44px] flex items-center justify-center"
        >
          Organization Demo
        </Link>
      </div>

      {/* Mobile-friendly images - shown on xs screens */}
      <div className="flex justify-center w-full mt-4 xs:hidden">
        <Image
          width={150}
          height={150}
          src={reviewng}
          alt="users"
          className="w-[150px] h-[150px]"
        />
      </div>

      {/* Desktop images */}
      <div className="hidden xs:flex justify-between w-full mt-6 sm:mt-10">
        <Image
          width={200}
          height={200}
          src={reviewng}
          alt="users"
          className="xs:w-[180px] xs:h-[180px] sm:w-[250px] sm:h-[250px] md:w-[323px] md:h-[323px]"
        />
        <Image
          width={200}
          height={200}
          src={sittingreading}
          alt="users"
          className="xs:w-[180px] xs:h-[180px] sm:w-[250px] sm:h-[250px] md:w-[323px] md:h-[323px]"
        />
      </div>
    </div>
  </div>
);

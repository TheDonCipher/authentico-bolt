import React from 'react';
import Link from 'next/link';

function Error({ statusCode }) {
  return (
    <div className="min-h-screen bg-ivory flex flex-col p-4">
      <header className="bg-soft-sage p-4 border-b-4 border-deep-moss mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-black text-deep-moss transform -rotate-2 bg-ivory p-2 border-4 border-deep-moss inline-block"
          >
            AUTHENTICO
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-soft-sage border-4 border-deep-moss p-8 shadow-brutal text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-block bg-burnt-sienna bg-opacity-20 p-4 border-4 border-deep-moss transform -rotate-2 mb-6">
                <h1 className="text-4xl md:text-6xl font-black text-deep-moss">
                  {statusCode ? `Error ${statusCode}` : 'An Error Occurred'}
                </h1>
              </div>

              <p className="text-xl mb-8 text-deep-moss">
                {statusCode === 404
                  ? "We couldn't find the page you're looking for."
                  : "We're sorry, something went wrong."}
              </p>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 bg-forest-green text-ivory px-6 py-3 font-bold border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  Go to Home Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;

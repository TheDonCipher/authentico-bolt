import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentSeal } from '../document/DocumentSeal';
import '../document/documentViewer.css';

interface NeubrutalistLoadingProps {
  message?: string;
  fullScreen?: boolean;
  subMessage?: string;
  showSeal?: boolean;
}

export const NeubrutalistLoading: React.FC<NeubrutalistLoadingProps> = ({
  message = 'Loading...',
  fullScreen = false,
  subMessage = 'Securely processing your request',
  showSeal = true,
}) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [animateStamp, setAnimateStamp] = useState(false);
  const [stampCount, setStampCount] = useState(0);
  const [showBlockchainEffect, setShowBlockchainEffect] = useState(false);

  // Animation sequence controller - simulating office document certification process
  useEffect(() => {
    // This is just a loading animation and shouldn't block the actual loading process
    // The component should be unmounted when the actual content is ready to display

    if (!showSeal) return;

    // Start the animation sequence
    const sequence = async () => {
      try {
        // Step 0: Initial state - reset
        setAnimationStep(0);
        setAnimateStamp(false);

        // Wait a moment before starting the next cycle
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 1: Shuffle papers - document is pulled from a stack
        setAnimationStep(1);

        // Step 2: Show form content - document is being filled out
        await new Promise((resolve) => setTimeout(resolve, 900));
        setAnimationStep(2);

        // Wait for form to be completely filled out (including signature)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Step 3: Position document for certification
        setAnimationStep(3);

        // Prepare for stamping
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Apply certification stamp
        setAnimateStamp(true);
        setStampCount((prev) => prev + 1);

        // Wait for stamp to complete
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Step 4: Show blockchain effect after stamping
        setAnimationStep(4); // New step for blockchain integration
        setShowBlockchainEffect(true);

        // Keep completed document visible with blockchain effect
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Hide blockchain effect before next cycle
        setShowBlockchainEffect(false);
      } catch (error) {
        console.error('Animation sequence error:', error);
        // Reset to initial state if there's an error
        setAnimationStep(0);
        setAnimateStamp(false);
        setShowBlockchainEffect(false);
      }
    };

    // Run the sequence initially
    sequence();

    // Set up interval to repeat the sequence
    const interval = setInterval(() => {
      sequence();
    }, 6000); // Reduced animation cycle time to prevent blocking actual loading

    return () => clearInterval(interval);
  }, [showSeal]);

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-ivory bg-opacity-90 flex items-center justify-center z-[100]'
    : 'flex flex-col items-center justify-center p-6';

  return (
    <div className={containerClasses}>
      <div className="bg-gray-900 border-3 border-forest-green p-4 shadow-[6px_6px_0px_0px_rgba(46,125,50,0.7)] max-w-xs w-full text-center relative">
        <h3 className="text-lg font-bold mb-2 text-white inline-block bg-forest-green bg-opacity-80 p-1.5 border-2 border-forest-green rounded-sm">
          {message}
        </h3>

        <div className="flex justify-center my-2">
          <div className="relative w-full h-60">
            {/* Stack of papers - centered and raised much higher */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ top: '-40px' }}
            >
              {/* Background stack (static) with more realistic details */}
              {[4, 3, 2, 1, 0].map((index) => (
                <div
                  key={`static-${index}`}
                  className={`absolute border-1.5 border-forest-green ${
                    index % 2 === 0
                      ? 'bg-gray-800'
                      : 'bg-gray-700 bg-opacity-90'
                  }`}
                  style={{
                    width: '120px',
                    height: '80px',
                    bottom: `${25 + index * 4}px`,
                    left: '50%',
                    transform: `translateX(-50%) rotate(${
                      ((index % 3) - 1) * 1.5
                    }deg)`,
                    zIndex: 1,
                    boxShadow:
                      index < 3
                        ? '3px 3px 6px rgba(0,0,0,0.2), 0 0 2px rgba(0,0,0,0.1)'
                        : '1px 1px 3px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Add subtle paper details */}
                  {index < 5 && (
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                      <div className="w-full h-0.5 bg-deep-moss mt-4 ml-3 mr-6"></div>
                      <div className="w-full h-0.5 bg-deep-moss mt-3 ml-5 mr-4"></div>
                      <div className="w-full h-0.5 bg-deep-moss mt-3 ml-2 mr-8"></div>
                      {index < 3 && (
                        <>
                          <div className="w-full h-0.5 bg-deep-moss mt-3 ml-4 mr-5"></div>
                          <div className="w-full h-0.5 bg-deep-moss mt-3 ml-6 mr-3"></div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Active document being processed - top to bottom animation */}
              <motion.div
                className="absolute border-1.5 border-forest-green bg-gray-700"
                style={{
                  width: '120px',
                  height: '80px',
                  zIndex: 10,
                  bottom: '25px', // Align with the top of the stack
                  boxShadow:
                    '4px 4px 8px rgba(0,0,0,0.25), 0 0 3px rgba(0,0,0,0.1)',
                }}
                initial={{
                  y: -90,
                  x: 'calc(50% + 60px)', // Start further to the right (like from a document tray)
                  opacity: 0,
                  rotate: -8,
                  scale: 0.9,
                }}
                animate={{
                  y: animationStep >= 1 ? [null, 0] : -90,
                  x: animationStep >= 1 ? [null, '50%'] : 'calc(50% + 60px)', // Move to center
                  opacity: animationStep >= 1 ? [null, 1] : 0,
                  rotate: animationStep >= 1 ? [null, 0] : -8,
                  scale: animationStep >= 1 ? [null, 1] : 0.9,
                  translateX: '-50%', // Center the element
                }}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                }}
              >
                {/* Paper texture */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="w-full h-full opacity-5">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`texture-${i}`}
                        className="w-full h-px bg-deep-moss"
                        style={{ marginTop: 10 + i * 10 }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Document content - simulating a form being filled out */}
                <AnimatePresence>
                  {animationStep >= 2 && (
                    <div className="p-2">
                      {/* Title/Header */}
                      <motion.div
                        className="h-2 bg-forest-green bg-opacity-60 rounded-sm mx-auto mb-2 mt-1"
                        style={{ width: '70%' }}
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '70%', opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />

                      {/* Form fields with labels and values */}
                      {[0, 1, 2].map((fieldGroup) => (
                        <div
                          key={`field-group-${fieldGroup}`}
                          className="flex mb-2"
                        >
                          {/* Label */}
                          <motion.div
                            className="h-1.5 bg-forest-green bg-opacity-40 rounded-sm mr-1"
                            style={{ width: '30%' }}
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '30%', opacity: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.3 + fieldGroup * 0.15,
                            }}
                          />

                          {/* Value - appears to be filled in */}
                          <motion.div
                            className="h-1.5 bg-forest-green bg-opacity-70 rounded-sm flex-grow"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '100%', opacity: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.4 + fieldGroup * 0.15,
                            }}
                          />
                        </div>
                      ))}

                      {/* Signature line */}
                      <div className="flex justify-end mt-3">
                        <motion.div
                          className="h-0.5 bg-forest-green bg-opacity-50 rounded-sm"
                          style={{ width: '40%' }}
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: '40%', opacity: 1 }}
                          transition={{
                            duration: 0.2,
                            delay: 0.9,
                          }}
                        />
                      </div>

                      {/* Signature */}
                      <div className="flex justify-end mt-1">
                        <motion.div
                          className="h-1.5 bg-forest-green bg-opacity-80 rounded-sm"
                          style={{
                            width: '35%',
                            transform: 'skew(-15deg, 0deg)',
                          }}
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: '35%', opacity: 1 }}
                          transition={{
                            duration: 0.3,
                            delay: 1.0,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Stamp mark that appears on the document after stamping */}
                <AnimatePresence>
                  {animationStep >= 3 &&
                    animateStamp && ( // Only show when stamp animation is active
                      <motion.div
                        className="absolute top-2 right-2 w-8 h-8 opacity-70"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.7, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }} // Delay slightly after stamp hits
                      >
                        <svg
                          viewBox="0 0 40 40"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="#2E7D32"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M12,20 L18,26 L28,14"
                            stroke="#2E7D32"
                            strokeWidth="2.5"
                            fill="none"
                          />
                        </svg>
                      </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Blockchain/Web3 animation effect - appears after stamping */}
            <AnimatePresence>
              {showBlockchainEffect && (
                <motion.div
                  className="absolute inset-0 pointer-events-none z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Blockchain glow effect around the document */}
                  <motion.div
                    className="absolute"
                    style={{
                      bottom: '25px',
                      left: '50%',
                      width: '140px',
                      height: '100px',
                      transform: 'translateX(-50%)',
                      boxShadow: '0 0 30px 10px rgba(74, 222, 128, 0.4)',
                      borderRadius: '2px',
                      zIndex: 5,
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 20px 5px rgba(74, 222, 128, 0.3)',
                        '0 0 40px 15px rgba(74, 222, 128, 0.5)',
                        '0 0 20px 5px rgba(74, 222, 128, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />

                  {/* Hexagon grid pattern - fades in */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 1.5 }}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <pattern
                          id="hexagons"
                          width="10"
                          height="10"
                          patternUnits="userSpaceOnUse"
                          patternTransform="scale(2.5)"
                        >
                          <path
                            d="M5,0 L10,5 L5,10 L0,5 Z"
                            fill="none"
                            stroke="#4ade80"
                            strokeWidth="0.7"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#hexagons)" />
                    </svg>
                  </motion.div>

                  {/* Animated blockchain nodes - appear from the stamp */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`node-${i}`}
                      className="absolute w-2 h-2 rounded-full bg-green-400"
                      style={{
                        top: '25%',
                        right: '25%',
                        boxShadow: '0 0 10px 3px rgba(74, 222, 128, 0.7)',
                        zIndex: 25,
                      }}
                      initial={{
                        x: 0,
                        y: 0,
                        opacity: 0,
                      }}
                      animate={{
                        x: [0, (Math.random() - 0.5) * 180],
                        y: [0, (Math.random() - 0.5) * 120],
                        opacity: [0, 0.9, 0.6],
                        scale: [0.5, 1.5, 1.2],
                      }}
                      transition={{
                        duration: 4,
                        delay: i * 0.3,
                        ease: 'easeOut',
                      }}
                    />
                  ))}

                  {/* Animated connection lines - emerge from stamp */}
                  {[...Array(7)].map((_, i) => (
                    <motion.div
                      key={`line-${i}`}
                      className="absolute bg-gradient-to-r from-green-400 to-transparent"
                      style={{
                        height: '2px',
                        width: '0%',
                        top: '25%',
                        right: '25%',
                        transformOrigin: 'right',
                        zIndex: 15,
                        boxShadow: '0 0 4px rgba(74, 222, 128, 0.8)',
                      }}
                      animate={{
                        width: `${40 + Math.random() * 50}%`,
                        rotate: 360 * Math.random(),
                        opacity: [0, 0.9, 0.4],
                      }}
                      transition={{
                        duration: 3.5,
                        delay: 0.2 + i * 0.25,
                        ease: 'easeOut',
                      }}
                    />
                  ))}

                  {/* Block confirmation animation */}
                  <motion.div
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    <div className="text-xs text-green-400 font-mono bg-gray-900 bg-opacity-80 px-2 py-0.5 rounded-sm border border-green-500 flex items-center">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span>Blockchain Verified</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Document Seal - positioned precisely on the corner of the active document */}
            {showSeal && (
              <div
                className="absolute z-30" // Higher z-index to ensure it's above everything
                style={{
                  // Position relative to the active document's corner
                  // Adjust positioning based on animation step
                  bottom:
                    animationStep >= 3 ? 'calc(25px + 80px - 18px)' : '200px', // 25px (bottom) + 80px (height) - 18px (offset for corner)
                  right:
                    animationStep >= 3
                      ? 'calc(50% - 120px/2 + 18px)'
                      : 'calc(50% - 120px/2 + 18px)', // 50% - half document width + corner offset
                  opacity: animationStep >= 3 ? 1 : 0, // Fade in when ready to stamp
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: 'rotate(0deg)', // Fixed angle
                }}
              >
                <motion.div
                  style={{
                    transformOrigin: 'center',
                    zIndex: 30,
                    position: 'relative',
                  }}
                  animate={{
                    y: animateStamp ? [40, 0] : 0, // Longer stamp down animation
                    scale: animateStamp ? [0.5, 0.35] : 0.35, // More dramatic scaling for better stamp effect
                    rotate: 0, // Ensure fixed angle
                  }}
                  transition={{
                    duration: 0.8, // Slower animation
                    ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing for more realistic stamping
                  }}
                  key={`stamp-${stampCount}`}
                >
                  <div style={{ transform: 'rotate(0deg)' }}>
                    <DocumentSeal
                      status="verified"
                      size="small"
                      className={`${
                        animateStamp
                          ? 'stamp-ink-animation'
                          : 'stamp-ink-animation-initial'
                      }`}
                    />
                  </div>

                  {/* Stamp impact effect */}
                  <AnimatePresence>
                    {animateStamp && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full bg-green-500"
                          initial={{ opacity: 0.7, scale: 0.8 }}
                          animate={{ opacity: 0, scale: 2 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 1.2,
                            ease: 'easeOut',
                          }}
                          style={{ filter: 'blur(10px)' }}
                        />

                        {/* Additional impact ripple */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-green-400"
                          initial={{ opacity: 0.9, scale: 0.8 }}
                          animate={{ opacity: 0, scale: 2.5 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 1.5,
                            delay: 0.1,
                            ease: 'easeOut',
                          }}
                        />
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        <p className="text-green-400 font-medium text-sm mb-2 tracking-wide">
          {subMessage}
        </p>
      </div>
    </div>
  );
};

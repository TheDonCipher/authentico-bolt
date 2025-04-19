import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  fullScreen?: boolean;
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'medium',
  color = '#556B2F',
  fullScreen = false,
  text,
}) => {
  // Size mapping
  const sizeMap = {
    small: {
      width: '24px',
      height: '24px',
      borderWidth: '3px',
    },
    medium: {
      width: '40px',
      height: '40px',
      borderWidth: '4px',
    },
    large: {
      width: '64px',
      height: '64px',
      borderWidth: '6px',
    },
  };

  const { width, height, borderWidth } = sizeMap[size];

  const spinnerStyle = {
    width,
    height,
    borderWidth,
    borderColor: `${color} transparent transparent transparent`,
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-ivory bg-opacity-80 z-50'
    : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <div
          className="animate-spin rounded-full border-solid"
          style={spinnerStyle}
        ></div>
        {text && (
          <p className="mt-4 font-bold text-deep-moss text-center">{text}</p>
        )}
      </div>
    </div>
  );
};

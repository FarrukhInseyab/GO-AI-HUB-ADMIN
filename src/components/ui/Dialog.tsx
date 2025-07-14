import React from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-lg sm:max-w-2xl lg:max-w-4xl max-h-[90vh] animate-fade-in-up">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 sm:px-6 py-3">
            <h3 className="text-lg font-medium leading-6 text-white">
              {title}
            </h3>
          </div>
          <div className="bg-white px-4 sm:px-6 pb-4 pt-5 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="w-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
import React from 'react';

interface AlertModalProps {
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
        <p className="text-gray-800 font-bold text-lg mb-6">{message}</p>
        <button 
          onClick={onClose}
          className="w-full p-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
        >
          OK
        </button>
      </div>
    </div>
  );
};

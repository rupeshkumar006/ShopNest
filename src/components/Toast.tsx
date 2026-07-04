import React from 'react';

export function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
      {message}
      <button className="ml-4" onClick={onClose}>✖</button>
    </div>
  );
}

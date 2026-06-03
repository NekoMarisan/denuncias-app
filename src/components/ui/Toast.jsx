import React, { useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const Toast = ({ id, type = 'error', message, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const bgColor = {
    success: 'bg-green-100 border-green-300 text-green-800',
    error: 'bg-red-100 border-red-300 text-red-800',
  }[type];

  const icon = type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />;

  return (
    <div className={`${bgColor} rounded-xl shadow-2xl flex items-center gap-3 px-5 py-3.5 border`}>
      {icon}
      <span className="text-xs font-semibold">{message}</span>
      <button onClick={() => onClose(id)} className="ml-auto hover:bg-white/30 p-1 rounded-full">
        <FaTimes size={12} />
      </button>
    </div>
  );
};

export default Toast;
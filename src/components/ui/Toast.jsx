import React, { useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const Toast = ({ id, type = 'error', message, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const bgColor = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-orange-100 text-orange-800',
  }[type] || 'bg-orange-100 text-orange-800';

  const accent = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f97316',
  }[type] || '#f97316';

  const icon = type === 'success'
    ? <FaCheckCircle />
    : type === 'warning'
    ? <FaExclamationTriangle className="text-orange-500" />
    : <FaExclamationTriangle />;

return (
    <div
      className={`${bgColor} rounded-xl shadow-2xl flex items-center gap-3 px-5 py-3.5 animate-[toastSlideDown_0.35s_ease-out] sm:animate-[toastSlideLeft_0.35s_ease-out]`}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {icon}
      <span className="text-xs font-semibold">
        {typeof message === "string"
          ? message.split("**").map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )
          : message}
      </span>
      <button onClick={() => onClose(id)} className="ml-auto hover:bg-white/30 p-1 rounded-full">
        <FaTimes size={12} />
      </button>
    </div>
  );
};

export default Toast;
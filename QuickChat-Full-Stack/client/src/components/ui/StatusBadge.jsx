import React from 'react';

const StatusBadge = ({ online }) => {
  const classes = online
    ? 'bg-emerald-400/80 ring-2 ring-emerald-500'
    : 'bg-slate-400/60 ring-2 ring-slate-500';

  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${classes}`}
      aria-label={online ? 'Online' : 'Offline'}
      title={online ? 'Online' : 'Offline'}
    />
  );
};

export default StatusBadge;

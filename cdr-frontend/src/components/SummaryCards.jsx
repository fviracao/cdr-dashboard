import React from 'react';

export default function SummaryCards({ summary }) {
  return (
<div className="row g-2 mb-2">
  <div className="col">
    <div className="card p-2 text-center">
      <small>Calls</small>
      <div className="small">{summary.calls ?? '-'}</div>
    </div>
  </div>
  <div className="col">
    <div className="card p-2 text-center">
      <small>Errors</small>
      <div className="small">{summary.errors ?? '-'}</div>
    </div>
  </div>
  <div className="col">
    <div className="card p-2 text-center">
      <small>Minutes</small>
      <div className="small">{summary.minutes ?? '-'}</div>
    </div>
  </div>
  <div className="col">
    <div className="card p-2 text-center">
      <small>FirstCall</small>
      <div className="small">{summary.firstCall ?? '-'}</div>
    </div>
  </div>
  <div className="col">
    <div className="card p-2 text-center">
      <small>LastCall</small>
      <div className="small">{summary.lastCall ?? '-'}</div>
    </div>
  </div>
</div>
  );
}
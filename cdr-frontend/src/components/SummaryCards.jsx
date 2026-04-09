import React from 'react';

export default function SummaryCards({ summary }) {
  return (
    <div className="row g-2 mb-3">
      <div className="col-md-2">
        <div className="card p-2 text-center">
          <small>Calls</small>
          <div className="h5">{summary.calls ?? '-'}</div>
        </div>
      </div>
      <div className="col-md-2">
        <div className="card p-2 text-center">
          <small>Errors</small>
          <div className="h5">{summary.errors ?? '-'}</div>
        </div>
      </div>
      <div className="col-md-2">
        <div className="card p-2 text-center">
          <small>Minutes</small>
          <div className="h5">{summary.minutes ?? '-'}</div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-2">
          <small>FirstCall</small>
          <div>{summary.firstCall ?? '-'}</div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card p-2">
          <small>LastCall</small>
          <div>{summary.lastCall ?? '-'}</div>
        </div>
      </div>
    </div>
  );
}
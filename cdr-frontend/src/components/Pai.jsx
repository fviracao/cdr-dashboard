import React, { useState } from 'react';
import FiltersBar from './FiltersBar';
import ReportTable from './ReportTable';

export default function ReportPage() {
  const [filters, setFilters] = useState({});

  function applyFilters(newFilters) {
    setFilters(newFilters);
    console.log('Filters applied:', newFilters);
  }

return (
  <div style={{ margin: 0, padding: 0, width: '100vw', overflow: 'hidden' }}>
    <div className="bg-secondary text-white py-1 text-center">
      <h5 className="mb-0 fw-bold">Engineering</h5>
    </div>

    <FiltersBar onApply={handleApply} />

    {loadingSummary ? (
      <div className="alert alert-info m-0 rounded-0 border-0">Carregando resumo...</div>
    ) : (
      <SummaryCards summary={summary} />
    )}

    <ReportTable filters={filters} />
  </div>
);
}
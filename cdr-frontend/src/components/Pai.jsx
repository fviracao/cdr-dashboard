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
    <div>
      <FiltersBar onApply={applyFilters} />
      <ReportTable filters={filters} />
    </div>
  );
}
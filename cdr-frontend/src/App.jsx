import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import FiltersBar from './components/FiltersBar';
import ReportTable from './components/ReportTable';
import SummaryCards from './components/SummaryCards';
import api from './api';
import './App.css';

export default function App() {
  const [filters, setFilters] = useState(null);
  const [summary, setSummary] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(false);

  async function handleApply(f) {
    setFilters(f);
    if (!f) {
      setSummary({});
      return;
    }

    // fetch aggregations (size:0) for summary
    setLoadingSummary(true);
    try {
      const resp = await api.post('/reports/search', { ...f, size: 0 });
      const aggs = resp.data.aggregations || {};
      const summaryObj = {
        calls: aggs.summary_calls?.value ?? 0,
        errors: aggs.summary_errors?.doc_count ?? 0,
        minutes: aggs.total_minutes?.value ? (aggs.total_minutes.value / 60).toFixed(0) : 0,
        firstCall: aggs.first_call?.value_as_string ?? '-',
        lastCall: aggs.last_call?.value_as_string ?? '-'
      };
      setSummary(summaryObj);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  }

  return (
    <div className="container py-4">
      <h3 className="mb-3 text-center">Engineering</h3>

      <FiltersBar onApply={handleApply} />

      {loadingSummary ? (
        <div className="alert alert-info">Carregando resumo...</div>
      ) : (
        <SummaryCards summary={summary} />
      )}

      <div className="card mt-3">
        <div className="card-body">
          <ReportTable filters={filters} />
        </div>
      </div>
    </div>
  );
}
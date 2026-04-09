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
    <div className="app-container">
      <div className="bg-light py-1 mb-1">
        <h4 className="mb-0 text-center fw-bold">Engineering 2</h4>
      </div>

      <FiltersBar onApply={handleApply} />

      {loadingSummary ? (
        <div className="alert alert-info m-0 mb-1">Carregando resumo...</div>
      ) : (
        <SummaryCards summary={summary} />
      )}

      <ReportTable filters={filters} />
    </div>
  );
}
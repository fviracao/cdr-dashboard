import React, { useEffect, useState } from 'react';
import api from '../api';
import './ReportTable.css'; // Vamos criar este arquivo CSS

export default function ReportTable({ filters }) {
  const [rows, setRows] = useState([]);
  const [size, setSize] = useState(50);
  const [from, setFrom] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetch() {
      console.log('=== FETCHING DATA ===');
      console.log('Filters received:', filters);
      
      if (!filters || Object.keys(filters).length === 0) {
        console.log('No filters, clearing data');
        setRows([]);
        setTotal(0);
        return;
      }
      
      setLoading(true);
      try {
        const filterArray = [];
        
        if (filters.record_type) {
          console.log('Adding record_type filter:', filters.record_type);
          filterArray.push({ term: { "record_type.keyword": filters.record_type } });
        }
        
        if (filters.called_number) {
          console.log('Adding called_number filter:', filters.called_number);
          filterArray.push({ wildcard: { "called_number.keyword": `*${filters.called_number}*` } });
        }
        
        if (filters.calling_number) {
          console.log('Adding calling_number filter:', filters.calling_number);
          filterArray.push({ wildcard: { "calling_number.keyword": `*${filters.calling_number}*` } });
        }
        
        if (filters.begin || filters.end) {
          const rangeFilter = { range: { ts: {} } };
          if (filters.begin) {
            console.log('Adding begin date:', filters.begin);
            rangeFilter.range.ts.gte = filters.begin;
          }
          if (filters.end) {
            console.log('Adding end date:', filters.end);
            rangeFilter.range.ts.lte = filters.end;
          }
          rangeFilter.range.ts.format = 'strict_date_optional_time||epoch_millis';
          filterArray.push(rangeFilter);
        }

        const payload = {
          size,
          from,
          query: {
            bool: {
              filter: filterArray
            }
          },
          _source: true,
          track_total_hits: true
        };
        
        console.log('=== PAYLOAD BEING SENT ===');
        console.log(JSON.stringify(payload, null, 2));
        
        const resp = await api.post('/reports/search', payload);
        
        console.log('=== RESPONSE RECEIVED ===');
        console.log('Full response:', resp);
        console.log('Response data:', resp.data);
        console.log('Hits:', resp.data.hits);
        
        const hits = resp.data.hits?.hits || [];
        console.log('Number of hits:', hits.length);
        console.log('First hit:', hits[0]);
        
        setTotal(resp.data.hits?.total?.value ?? 0);
        setRows(hits.map(h => h._source));
        
        console.log('Rows set:', hits.length);
        console.log('Total set:', resp.data.hits?.total?.value ?? 0);
      } catch (err) {
        console.error('=== ERROR FETCHING DATA ===');
        console.error('Error:', err);
        console.error('Error response:', err.response);
        console.error('Error data:', err.response?.data);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [filters, size, from]);

  function nextPage() {
    setFrom(p => p + size);
  }

  function prevPage() {
    setFrom(p => Math.max(0, p - size));
  }

  // Formata timestamp para exibição compacta
  function formatTimestamp(ts) {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Formata duração em segundos para mm:ss
  function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="report-table-container">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div><strong>Total: {total.toLocaleString()}</strong></div>
        <div>
          <button className="btn btn-sm btn-secondary me-2" onClick={prevPage} disabled={from === 0}>
            Prev
          </button>
          <button className="btn btn-sm btn-secondary" onClick={nextPage} disabled={from + size >= total}>
            Next
          </button>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando tabela...</div>}

      <div className="table-wrapper">
        <table className="table table-sm table-bordered table-hover compact-table">
          <thead className="table-light sticky-header">
            <tr>
              <th className="col-timestamp">Timestamp</th>
              <th className="col-number">Calling</th>
              <th className="col-number">Called</th>
              <th className="col-duration">Duration</th>
              <th className="col-nap">Incoming NAP</th>
              <th className="col-nap">NAP</th>
              <th className="col-cause">Cause</th>
              <th className="col-ip">Local IP</th>
              <th className="col-ip">Remote IP</th>
              <th className="col-codec">Codec</th>
              <th className="col-type">Type</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr><td colSpan="11" className="text-center text-muted">Sem dados</td></tr>
            )}
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td className="text-nowrap">{formatTimestamp(r.ts)}</td>
                <td className="text-nowrap">{r.calling_number ?? '-'}</td>
                <td className="text-nowrap">{r.called_number ?? '-'}</td>
                <td className="text-center">{formatDuration(r.call_duration)}</td>
                <td className="text-truncate" title={r.incoming_nap}>{r.incoming_nap ?? '-'}</td>
                <td className="text-truncate" title={r.nap}>{r.nap ?? '-'}</td>
                <td className="text-truncate" title={r.termination_cause_string ?? r.termination_cause}>
                  {r.termination_cause_string ?? r.termination_cause ?? '-'}
                </td>
                <td className="text-nowrap font-monospace small">{r.local_sip_ip ?? '-'}</td>
                <td className="text-nowrap font-monospace small">{r.remote_sip_ip ?? '-'}</td>
                <td className="text-center">{r.codec ?? '-'}</td>
                <td className="text-center">
                  <span className={`badge bg-${r.record_type === 'END' ? 'success' : 'info'}`}>
                    {r.record_type ?? '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
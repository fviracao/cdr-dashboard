import React, { useEffect, useState } from 'react';
import api from '../api';

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
        
        // Adiciona filtro de record_type se existir
        if (filters.record_type) {
          console.log('Adding record_type filter:', filters.record_type);
          filterArray.push({ term: { "record_type.keyword": filters.record_type } });
        }
        
        // Adiciona filtro de called_number se existir
        if (filters.called_number) {
          console.log('Adding called_number filter:', filters.called_number);
          filterArray.push({ wildcard: { "called_number.keyword": `*${filters.called_number}*` } });
        }
        
        // Adiciona filtro de calling_number se existir
        if (filters.calling_number) {
          console.log('Adding calling_number filter:', filters.calling_number);
          filterArray.push({ wildcard: { "calling_number.keyword": `*${filters.calling_number}*` } });
        }
        
        // Adiciona filtro de range de data se begin OU end existir
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>Total: {total}</div>
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

      <div className="table-responsive">
        <table className="table table-sm table-bordered">
          <thead className="table-light">
            <tr>
              <th>ts</th>
              <th>calling_number</th>
              <th>called_number</th>
              <th>call_duration</th>
              <th>record_type</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr><td colSpan="5" className="text-center">Sem dados</td></tr>
            )}
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td>{r.ts}</td>
                <td>{r.calling_number ?? '-'}</td>
                <td>{r.called_number ?? '-'}</td>
                <td>{r.call_duration ?? '-'}</td>
                <td>{r.record_type ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function FiltersBar({ onApply }) {
  // Função para obter data de hoje às 00:00
  const getTodayStart = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Função para obter data de hoje às 23:59
  const getTodayEnd = () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const [begin, setBegin] = useState(getTodayStart());
  const [end, setEnd] = useState(getTodayEnd());
  const [recordType, setRecordType] = useState('END');
  const [calledNumber, setCalledNumber] = useState('');

  function apply() {
    const filters = {
      begin: begin ? begin.toISOString() : undefined,
      end: end ? end.toISOString() : undefined,
      record_type: recordType || undefined,
      called_number: calledNumber || undefined
    };
    onApply(filters);
  }

  function clearAll() {
    setBegin(getTodayStart());
    setEnd(getTodayEnd());
    setRecordType('END');
    setCalledNumber('');
    onApply({});
  }

  return (
    <div className="py-2 border-bottom bg-light">
      <div className="row g-2 align-items-end">
        <div className="col-md-2">
          <label className="form-label small mb-1">Begin Date</label>
          <DatePicker
            selected={begin}
            onChange={(d) => setBegin(d)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="form-control form-control-sm"
            placeholderText="Begin"
          />
        </div>

        <div className="col-md-2">
          <label className="form-label small mb-1">End Date</label>
          <DatePicker
            selected={end}
            onChange={(d) => setEnd(d)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="form-control form-control-sm"
            placeholderText="End"
          />
        </div>

        <div className="col-md-2">
          <label className="form-label small mb-1">Record Type</label>
          <select 
            className="form-select form-select-sm" 
            value={recordType} 
            onChange={(e) => setRecordType(e.target.value)}
          >
            <option value="END">END</option>
            <option value="START">START</option>
            <option value="">Any</option>
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label small mb-1">Orig./Called</label>
          <input
            className="form-control form-control-sm"
            placeholder="Called number"
            value={calledNumber}
            onChange={(e) => setCalledNumber(e.target.value)}
          />
        </div>

        <div className="col-md-3 text-end">
          <button className="btn btn-warning btn-sm me-2" onClick={clearAll}>
            Clear
          </button>
          <button className="btn btn-primary btn-sm" onClick={apply}>
            Run
          </button>
        </div>
      </div>
    </div>
  );
}
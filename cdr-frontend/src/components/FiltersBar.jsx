import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function FiltersBar({ onApply }) {
  const [begin, setBegin] = useState(null);
  const [end, setEnd] = useState(null);
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
    setBegin(null);
    setEnd(null);
    setRecordType('END');
    setCalledNumber('');
    onApply({});
  }

  return (
    <div className="card p-3 mb-3">
      <div className="row g-2 align-items-center">
        <div className="col-md-3">
          <label className="form-label">Begin Date</label>
          <DatePicker
            selected={begin}
            onChange={(d) => setBegin(d)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="form-control"
            placeholderText="Begin"
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">End Date</label>
          <DatePicker
            selected={end}
            onChange={(d) => setEnd(d)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="form-control"
            placeholderText="End"
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Record Type</label>
          <select className="form-select" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
            <option value="END">END</option>
            <option value="START">START</option>
            <option value="">Any</option>
          </select>
        </div>

        <div className="col-md-2">
          <label className="form-label">Orig./Called</label>
          <input
            className="form-control"
            placeholder="Called number"
            value={calledNumber}
            onChange={(e) => setCalledNumber(e.target.value)}
          />
        </div>

        <div className="col-12 d-flex justify-content-end mt-2">
          <button className="btn btn-warning me-2" onClick={clearAll}>Clear</button>
          <button className="btn btn-primary" onClick={apply}>Run</button>
        </div>
      </div>
    </div>
  );
}
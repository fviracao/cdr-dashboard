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
  const [calledNumber, setCalledNumber] = useState('');
  const [callingNumber, setCallingNumber] = useState('');
  const [incomingNap, setIncomingNap] = useState('');
  const [nap, setNap] = useState('');
  const [localSipIp, setLocalSipIp] = useState('');
  const [remoteSipIp, setRemoteSipIp] = useState('');

  function apply() {
    const filters = {
      begin: begin ? begin.toISOString() : undefined,
      end: end ? end.toISOString() : undefined,
      record_type: 'END',
      called_number: calledNumber || undefined,
      calling_number: callingNumber || undefined,
      incoming_nap: incomingNap || undefined,
      nap: nap || undefined,
      local_sip_ip: localSipIp || undefined,
      remote_sip_ip: remoteSipIp || undefined
    };
    onApply(filters);
  }

  function clearAll() {
    setBegin(getTodayStart());
    setEnd(getTodayEnd());
    setCalledNumber('');
    setCallingNumber('');
    setIncomingNap('');
    setNap('');
    setLocalSipIp('');
    setRemoteSipIp('');
    onApply({});
  }

  return (
    <div className="py-2 border-bottom bg-light">
      {/* Primeira linha: Begin Date, End Date */}
      <div className="row g-2 align-items-end mb-2">
        <div className="col-md-6">
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

        <div className="col-md-6">
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
      </div>

      {/* Segunda linha: Calling Number, Called Number, Incoming NAP, NAP, Local SIP IP, Remote SIP IP */}
      <div className="row g-2 align-items-end mb-2">
        <div className="col-md-2">
          <label className="form-label small mb-1">Calling Number</label>
          <input
            className="form-control form-control-sm"
            placeholder="Calling number"
            value={callingNumber}
            onChange={(e) => setCallingNumber(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label small mb-1">Called Number</label>
          <input
            className="form-control form-control-sm"
            placeholder="Called number"
            value={calledNumber}
            onChange={(e) => setCalledNumber(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label small mb-1">Incoming NAP</label>
          <input
            className="form-control form-control-sm"
            placeholder="Incoming NAP"
            value={incomingNap}
            onChange={(e) => setIncomingNap(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label small mb-1">NAP</label>
          <input
            className="form-control form-control-sm"
            placeholder="NAP"
            value={nap}
            onChange={(e) => setNap(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label small mb-1">Local SIP IP</label>
          <input
            className="form-control form-control-sm"
            placeholder="Local SIP IP"
            value={localSipIp}
            onChange={(e) => setLocalSipIp(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label small mb-1">Remote SIP IP</label>
          <input
            className="form-control form-control-sm"
            placeholder="Remote SIP IP"
            value={remoteSipIp}
            onChange={(e) => setRemoteSipIp(e.target.value)}
          />
        </div>
      </div>

      {/* Terceira linha: Botões */}
      <div className="row g-2">
        <div className="col-md-12 text-end">
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
import React, { useRef, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const LivePage = () => {
  const tableRef = useRef(null);
  const calendarRef = useRef(null);

  // table data, dropdown list, loading & error state
  const [data, setData] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // copy-to-clipboard flag
  const [copied, setCopied] = useState(false);

  // filter state
  const [filters, setFilters] = useState({
    domain: "",
    goLiveRange: {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // ─── fetch domain dropdown options ──────────────────────────────
  const fetchDomains = async () => {
    try {
      const res = await fetch("/get_domains?username=&domain=&processname=");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      // your endpoint returns { usernames1: [...], domains1: [...], processes1: [...] }
      setDomains(json.domains1 || []);
    } catch (err) {
      console.error("Failed to fetch domains:", err);
    }
  };

  // ─── fetch table data with optional filters ───────────────────
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.domain) {
        params.append("domain", filters.domain);
      }
      if (filters.goLiveRange.startDate && filters.goLiveRange.endDate) {
        // send YYYY-MM-DD for TRY_CONVERT in SQL
        const toISO = d => d.toISOString().slice(0,10);
        params.append("startDate", toISO(filters.goLiveRange.startDate));
        params.append("endDate", toISO(filters.goLiveRange.endDate));
      }

      const res = await fetch(`/processlist?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── handlers ───────────────────────────────────────────────────
  const handleInputChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const handleSearch = () => fetchData();

  const handleCopy = () => {
    const text = data.map(r => Object.values(r).join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LiveData");
    XLSX.writeFile(wb, "LiveData.xlsx");
  };

  const handleExportCSV = () => {
    const rows = [
      ["Process", "NLT", "Domain", "Owner", "Stage", "Go Live"],
      ...data.map(r => [r.process, r.nlt, r.domain, r.owner, r.stage, r.goLive])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "LiveData.csv";
    a.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Process","NLT","Domain","Owner","Stage","Go Live"]],
      body: data.map(r => [r.process, r.nlt, r.domain, r.owner, r.stage, r.goLive])
    });
    doc.save("LiveData.pdf");
  };

  // ─── close calendar on outside click ───────────────────────────
  useEffect(() => {
    const onClick = e => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ─── initial load ───────────────────────────────────────────────
  useEffect(() => {
    fetchDomains();
    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <div className="p-6">
          {/* Filters */}
          <div className="flex items-end flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Domain</label>
              <select
                name="domain"
                value={filters.domain}
                onChange={handleInputChange}
                className="border rounded-md px-4 py-2 w-56"
              >
                <option value="">All Domains</option>
                {domains.map((d,i) => <option key={i} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="relative" ref={calendarRef}>
              <label className="block text-sm font-semibold text-gray-700">Go Live Range</label>
              <input
                readOnly
                className="border rounded-md px-4 py-2 w-64 bg-white cursor-pointer"
                value={`${filters.goLiveRange.startDate.toLocaleDateString()} - ${filters.goLiveRange.endDate.toLocaleDateString()}`}
                onClick={() => setShowCalendar(v => !v)}
              />
              {showCalendar && (
                <div className="absolute z-50 mt-2 shadow-lg border rounded-md bg-white">
                  <DateRange
                    ranges={[filters.goLiveRange]}
                    editableDateInputs
                    moveRangeOnFirstSelection={false}
                    onChange={({ selection }) => {
                      setFilters(f => ({ ...f, goLiveRange: selection }));
                      setShowCalendar(false);
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-700"
            >
              Search
            </button>
          </div>

          {/* Export & total */}
          <div className="flex justify-between items-center flex-wrap mb-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-md text-white ${copied ? "bg-blue-600" : "bg-indigo-500 hover:bg-indigo-600"}`}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={handleExportExcel} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md">
                Excel
              </button>
              <button onClick={handleExportCSV} className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-md">
                CSV
              </button>
              <button onClick={handleExportPDF} className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-md">
                PDF
              </button>
            </div>
            <div className="text-lg font-semibold text-gray-700">
              Total Records: {data.length}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading...</div>
            ) : error ? (
              <div className="p-10 text-center text-red-500">{error}</div>
            ) : data.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No data found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left" ref={tableRef}>
                <thead className="bg-red-500 text-white">
                  <tr>
                    <th className="px-6 py-3">Process</th>
                    <th className="px-6 py-3">NLT</th>
                    <th className="px-6 py-3">Domain</th>
                    <th className="px-6 py-3">Owner</th>
                    <th className="px-6 py-3">Stage</th>
                    <th className="px-6 py-3">Go Live</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((r,i) => (
                    <tr key={i} className="hover:bg-gray-100">
                      <td className="px-6 py-4">{r.process}</td>
                      <td className="px-6 py-4">{r.nlt}</td>
                      <td className="px-6 py-4">{r.domain}</td>
                      <td className="px-6 py-4">{r.owner}</td>
                      <td className="px-6 py-4">{r.stage}</td>
                      <td className="px-6 py-4">{r.goLive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePage;

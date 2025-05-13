import React, { useEffect, useState } from "react";

export const FilterBar = ({ onSearch }) => {
  const [nltList, setNltList] = useState([]);
  const [domainList, setDomainList] = useState([]);
  const [processList, setProcessList] = useState([]);

  const [filters, setFilters] = useState({
    NLTName: "",
    DomainName: "",
    ProcessName: "",
    Status: "",
    StartDate: "",
    EndDate: "",
  });

  useEffect(() => {
    fetch("/get_domains")
      .then((res) => res.json())
      .then((data) => {
        setNltList(data.NLT || []);
        setDomainList(data.Domain || []);
        setProcessList(data.Process || []);
      })
      .catch((err) => console.error("Error fetching dropdowns:", err));
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    const nonEmptyFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );
    onSearch(nonEmptyFilters);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <select
          name="NLTName"
          value={filters.NLTName}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        >
          <option value="">NLT Name</option>
          {nltList.map((nlt) => (
            <option key={nlt} value={nlt}>
              {nlt}
            </option>
          ))}
        </select>

        <select
          name="DomainName"
          value={filters.DomainName}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        >
          <option value="">Domain Name</option>
          {domainList.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        <select
          name="ProcessName"
          value={filters.ProcessName}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        >
          <option value="">Process Name</option>
          {processList.map((proc) => (
            <option key={proc} value={proc}>
              {proc}
            </option>
          ))}
        </select>

        <select
          name="Status"
          value={filters.Status}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        >
          <option value="">Status</option>
          <option value="Success">Success</option>
          <option value="Failure">Failure</option>
        </select>

        <input
          type="date"
          name="StartDate"
          value={filters.StartDate}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />

        <input
          type="date"
          name="EndDate"
          value={filters.EndDate}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
      </div>

      <div className="text-right">
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>
    </div>
  );
};

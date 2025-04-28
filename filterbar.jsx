import React, { useState } from "react";

const FilterBar = ({ setFilters, fetchData, filterOptions }) => {
  const [formData, setFormData] = useState({
    nltName: "",
    domain: "",
    process: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    setFilters(formData);
    fetchData();
  };

  return (
    <div className="grid grid-cols-6 gap-4 mb-4">
      {/* NLT Name Input */}
      <input
        name="nltName"
        placeholder="NLT Name"
        value={formData.nltName}
        onChange={handleChange}
        className="p-2 border rounded"
      />

      {/* Domain Name Dropdown */}
      <select
        name="domain"
        value={formData.domain}
        onChange={handleChange}
        className="p-2 border rounded"
      >
        <option value="">Domain Name</option>
        {filterOptions.domains &&
          filterOptions.domains.map((domain, index) => (
            <option key={index} value={domain}>
              {domain}
            </option>
          ))}
      </select>

      {/* Process Name Dropdown */}
      <select
        name="process"
        value={formData.process}
        onChange={handleChange}
        className="p-2 border rounded"
      >
        <option value="">Process Name</option>
        {filterOptions.processes &&
          filterOptions.processes.map((process, index) => (
            <option key={index} value={process}>
              {process}
            </option>
          ))}
      </select>

      {/* Status Dropdown */}
      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
        className="p-2 border rounded"
      >
        <option value="">Status</option>
        <option value="Success">Success</option>
        <option value="Failed">Failed</option>
      </select>

      {/* Start Date Input */}
      <input
        type="date"
        name="startDate"
        value={formData.startDate}
        onChange={handleChange}
        className="p-2 border rounded"
      />

      {/* End Date Input */}
      <input
        type="date"
        name="endDate"
        value={formData.endDate}
        onChange={handleChange}
        className="p-2 border rounded"
      />

      {/* Search Button */}
      <div className="col-start-6 flex justify-end">
        <button
          onClick={handleSearch}
          className="bg-red-600 hover:bg-red-700 text-white px-14 py-2 rounded transition"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default FilterBar;

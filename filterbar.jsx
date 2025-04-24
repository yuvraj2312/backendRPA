import React, { useState, useEffect } from "react";

const FilterBar = ({ usernames, domains, processNames, onChange }) => {
  const [formData, setFormData] = useState({
    username: "",
    domain: "",
    process: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
    onChange(e.target.name, e.target.value);
  };

  return (
    <div className="grid grid-cols-6 gap-4 mb-4">
      {/* NLT Name Dropdown */}
      <select name="username" value={formData.username} onChange={handleChange} className="p-2 border rounded">
        <option value="">NLT Name</option>
        {usernames.map((name, i) => (
          <option key={i} value={name}>{name}</option>
        ))}
      </select>

      {/* Domain Name Dropdown */}
      <select name="domain" value={formData.domain} onChange={handleChange} className="p-2 border rounded">
        <option value="">Domain Name</option>
        {domains.map((domain, i) => (
          <option key={i} value={domain}>{domain}</option>
        ))}
      </select>

      {/* Process Name Dropdown */}
      <select name="process" value={formData.process} onChange={handleChange} className="p-2 border rounded">
        <option value="">Process Name</option>
        {processNames.map((process, i) => (
          <option key={i} value={process}>{process}</option>
        ))}
      </select>

      {/* Status Dropdown */}
      <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded">
        <option value="">Status</option>
        <option value="Success">Success</option>
        <option value="Failed">Failed</option>
      </select>

      {/* Date Inputs */}
      <input type="date" name="startDate" onChange={handleChange} className="p-2 border rounded" />
      <input type="date" name="endDate" onChange={handleChange} className="p-2 border rounded" />
    </div>
  );
};

export default FilterBar;

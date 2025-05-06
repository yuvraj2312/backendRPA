import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const AdhocTrigger = () => {
  const [formData, setFormData] = useState({
    domain: "",
    process: "",
  });

  const [domainOptions, setDomainOptions] = useState([]);
  const [processOptions, setProcessOptions] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:8000/get_domains") // update port if needed
      .then((response) => {
        setDomainOptions(response.data.domains1 || []);
        setProcessOptions(response.data.processes1 || []);
      })
      .catch((error) => {
        console.error("Error fetching dropdown data:", error);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const { domain, process } = formData;
    if (!domain || !process) {
      alert("Please enter both Domain and Process Name.");
      return;
    }
  
    if (
      domain === "NOC" &&
      process === "Traffic_Confirmation_Pre & Post_Change Activity"
    ) {
      navigate("/traffic-dashboard", {
        state: { domain, process },
      });
    } else {
      alert("Process not found.");
    }
  };
  

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 bg-gray-100 p-8">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg mt-16">
            <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">
              Adhoc Trigger
            </h1>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Domain Name <span className="text-red-500">*</span>
                </label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Domain</option>
                  {domainOptions.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Process Name <span className="text-red-500">*</span>
                </label>
                <select
                  name="process"
                  value={formData.process}
                  onChange={handleInputChange}
                  className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Process</option>
                  {processOptions.map((process) => (
                    <option key={process} value={process}>
                      {process}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-center">
                <button
                  onClick={handleSearch}
                  className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-700 transition"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdhocTrigger;

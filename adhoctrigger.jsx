import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const AdhocTrigger = () => {
  const [formData, setFormData] = useState({
    domain: "",
    process: "",
  });

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearch = () => {
    if (formData.domain && formData.process) {
      navigate("/traffic-dashboard", {
        state: { domain: formData.domain, process: formData.process },
      });
    } else {
      alert("Please enter both Domain and Process Name.");
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
                <input
                  type="text"
                  name="domain"
                  placeholder="Enter Domain Name"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Process Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="process"
                  placeholder="Enter Process Name"
                  value={formData.process}
                  onChange={handleInputChange}
                  className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                />
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

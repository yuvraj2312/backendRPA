import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const TrafficDashboard = () => {
  const location = useLocation();
  const { domain, process } = location.state || {};

  const [checkType, setCheckType] = useState("Precheck");
  const [formData, setFormData] = useState({
    nodeIp: "",
    file: null,
  });

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 bg-gray-100 p-8">
          <div className="w-full bg-white rounded-lg shadow-lg p-10">
            <h2 className="text-2xl font-bold mb-8 text-blue-900 text-center">
              Automation Request Form
            </h2>

            <div className="max-w-4xl mx-auto space-y-6">
              {/* Pre/Post check buttons */}
              <div className="flex justify-center gap-6">
                {["Precheck", "Postcheck"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setCheckType(type)}
                    className={`px-6 py-2 rounded-md border ${
                      checkType === type
                        ? "bg-red-600 text-white"
                        : "bg-white text-gray-800"
                    } hover:shadow`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Node IP */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Node IP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nodeIp"
                  value={formData.nodeIp}
                  onChange={handleInputChange}
                  placeholder="e.g. 192.168.1.1"
                  className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Download Template, Upload File, and Process Button */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <button className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 w-full">
                    Download Template
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Upload File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="file"
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-2 py-2"
                  />
                </div>

                <div className="flex items-end">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full">
                    Process
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-start mt-6">
                <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficDashboard;

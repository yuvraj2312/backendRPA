import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import * as XLSX from "xlsx";
import axios from "axios";

// ... (imports remain the same)

const TrafficDashboard = () => {
  const location = useLocation();
  const { domain, process } = location.state || {};

  const [checkType, setCheckType] = useState("Precheck");
  const [formData, setFormData] = useState({ nodeIp: "", file: null });
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "file" && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (evt) => {
        const binaryStr = evt.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const [headers, ...rows] = data;
        if (
          headers[0]?.toLowerCase() !== "node_ip" ||
          headers[1]?.toLowerCase() !== "checktype"
        ) {
          alert("Invalid file format. Expected headers: node_ip, checktype");
          return;
        }

        const formattedRows = rows.map((row, index) => {
          if (!row[0] || !row[1]) {
            console.warn(`Skipping row ${index + 2}: Missing data`);
            return null;
          }
          return { node_ip: row[0], checktype: row[1] };
        }).filter(Boolean);

        if (formattedRows.length === 0) {
          alert("No valid rows found in the file.");
          return;
        }

        setParsedData(formattedRows);
        setFormData({ ...formData, file });
        alert(`${formattedRows.length} rows parsed successfully.`);
      };

      reader.readAsBinaryString(file);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["node_ip", "checktype"],
      ["10.109.115.42", "Precheck"],
      ["10.109.115.43", "Postcheck"]
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "template.xlsx");
  };

  const handleSubmit = async () => {
    const submitData = parsedData.length > 0
      ? parsedData
      : formData.nodeIp
        ? [{ node_ip: formData.nodeIp, checktype: checkType }]
        : [];

    if (submitData.length === 0) {
      alert("Please provide Node IP or upload a valid file.");
      return;
    }

    try {
      setLoading(true);

      for (const row of submitData) {
        const formPayload = new FormData();
        formPayload.append("node_ip", row.node_ip);
        formPayload.append("checktype", row.checktype);

        const response = await axios.post("http://127.0.0.1:5000/Deploysubmit", formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.status !== 200) throw new Error("Submission failed.");
      }

      alert("Submitted successfully!");
      setFormData({ nodeIp: "", file: null });
      setParsedData([]);
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred while submitting the data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-100 p-6 md:p-10">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h1 className="text-3xl font-bold text-blue-900 mb-8 text-center">
              Automation Request Form
            </h1>

            {/* Checktype Toggle */}
            <div className="flex justify-center gap-6 mb-10">
              {["Precheck", "Postcheck"].map((type) => (
                <button
                  key={type}
                  onClick={() => setCheckType(type)}
                  className={`px-6 py-2 rounded-lg border transition duration-150 ${
                    checkType === type
                      ? "bg-blue-600 text-white shadow"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Manual Entry */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Enter Node IP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nodeIp"
                  value={formData.nodeIp}
                  onChange={handleInputChange}
                  placeholder="e.g. 192.168.1.1"
                  className="w-full border border-gray-300 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Upload File */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload Excel File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="file"
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  accept=".xlsx, .xls"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md transition"
                onClick={downloadTemplate}
              >
                Download Template
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`bg-green-600 text-white px-8 py-2 rounded-md hover:bg-green-700 transition ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>

            {/* Parsed Preview */}
            {parsedData.length > 0 && (
              <div className="mt-10 bg-gray-50 rounded-md p-4 shadow-inner">
                <h4 className="text-md font-semibold mb-2 text-gray-700">Parsed Entries:</h4>
                <ul className="text-sm text-gray-800 space-y-1 max-h-60 overflow-y-auto">
                  {parsedData.map((item, idx) => (
                    <li key={idx} className="border-b border-dashed py-1">
                      <span className="font-mono text-blue-900">{item.node_ip}</span> —{" "}
                      <span className="italic">{item.checktype}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrafficDashboard;


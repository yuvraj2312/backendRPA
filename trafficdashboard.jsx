import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import * as XLSX from "xlsx";

const TrafficDashboard = () => {
  const location = useLocation();
  const { domain, process } = location.state || {};

  const [checkType, setCheckType] = useState("Precheck");
  const [formData, setFormData] = useState({
    nodeIp: "",
    file: null,
  });
  const [parsedData, setParsedData] = useState([]);

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
        setFormData({
          ...formData,
          file: file
        });

        alert(`${formattedRows.length} rows parsed successfully.`);
      };

      reader.readAsBinaryString(file);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
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

              {/* Node IP (optional if uploading file) */}
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
                  <button
                    className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 w-full"
                    onClick={downloadTemplate}
                  >
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
                    accept=".xlsx, .xls"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full"
                    onClick={() => console.log("Parsed Data:", parsedData)}
                  >
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

              {/* Show parsed data if available */}
              {parsedData.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Parsed Entries:</h4>
                  <ul className="text-sm bg-gray-100 p-4 rounded-md max-h-64 overflow-y-auto">
                    {parsedData.map((item, idx) => (
                      <li key={idx}>
                        {item.node_ip} - {item.checktype}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficDashboard;

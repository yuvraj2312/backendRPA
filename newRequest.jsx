import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

// Simple reusable input field
const InputField = ({ label, name, value, onChange, required = false }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// Simple reusable select field
const SelectField = ({ label, name, value, onChange, options, required = false }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
);

const NewRequest = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    OLM_ID: '',
    Priority: '',
    Use_Case_Name: '',
    Use_Case_Description: '',
    Volume_Unit: '',
    Volume: '',
    Activity_Frequency: '',
    Circle_Number: '',
    Circle_Name: '',
    Time_Required: '',
    SLA_Expected: '',
    No_of_Assistant_Manager: '',
    No_of_Deputy_Manager: '',
    No_of_Manager: '',
    No_of_Senior: '',
    OEM_Domain: '',
    Application_Used: '',
    Activity_Performed_By: '',
    Partner_Name: '',
    KPI_Indicators: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formPayload = new FormData();
      for (const key in formData) {
        formPayload.append(key, formData[key]);
      }

      const response = await axios.post('/Usecase', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.request.responseURL.includes('success=true')) {
        const trackingId = new URL(response.request.responseURL).searchParams.get('tracking_id');
        alert(`Form submitted successfully! Tracking ID: ${trackingId}`);
      } else {
        alert('Submission failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting the form.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <Header />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-blue-900">Automation Request Form</h1>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md">

            {/* All fields as per backend */}
            <InputField label="OLM ID" name="OLM_ID" value={formData.OLM_ID} onChange={handleChange} required />
            <SelectField label="Priority" name="Priority" value={formData.Priority} onChange={handleChange} options={["P1", "P2", "P3", "P4"]} required />

            <InputField label="Use Case Name" name="Use_Case_Name" value={formData.Use_Case_Name} onChange={handleChange} required />
            <InputField label="Use Case Description" name="Use_Case_Description" value={formData.Use_Case_Description} onChange={handleChange} required />

            <InputField label="Volume Unit" name="Volume_Unit" value={formData.Volume_Unit} onChange={handleChange} />
            <InputField label="Volume" name="Volume" value={formData.Volume} onChange={handleChange} />

            <InputField label="Activity Frequency" name="Activity_Frequency" value={formData.Activity_Frequency} onChange={handleChange} />
            <InputField label="Circle Number" name="Circle_Number" value={formData.Circle_Number} onChange={handleChange} />

            <InputField label="Circle Name" name="Circle_Name" value={formData.Circle_Name} onChange={handleChange} />
            <InputField label="Time Required (in hours)" name="Time_Required" value={formData.Time_Required} onChange={handleChange} />

            <InputField label="SLA Expected" name="SLA_Expected" value={formData.SLA_Expected} onChange={handleChange} />

            <InputField label="No. of Assistant Manager" name="No_of_Assistant_Manager" value={formData.No_of_Assistant_Manager} onChange={handleChange} />
            <InputField label="No. of Deputy Manager" name="No_of_Deputy_Manager" value={formData.No_of_Deputy_Manager} onChange={handleChange} />
            <InputField label="No. of Manager" name="No_of_Manager" value={formData.No_of_Manager} onChange={handleChange} />
            <InputField label="No. of Senior" name="No_of_Senior" value={formData.No_of_Senior} onChange={handleChange} />

            <InputField label="OEM Domain" name="OEM_Domain" value={formData.OEM_Domain} onChange={handleChange} />
            <InputField label="Application Used" name="Application_Used" value={formData.Application_Used} onChange={handleChange} />
            <InputField label="Activity Performed By" name="Activity_Performed_By" value={formData.Activity_Performed_By} onChange={handleChange} />
            <InputField label="Partner Name" name="Partner_Name" value={formData.Partner_Name} onChange={handleChange} />
            <InputField label="KPI Indicators" name="KPI_Indicators" value={formData.KPI_Indicators} onChange={handleChange} />

            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition shadow">
                Submit
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default NewRequest;

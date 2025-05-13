import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header"; // Optional
import axios from "axios";

const InputField = ({ label, ...props }) => (
  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">{label}</label>
    <input
      {...props}
      className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
    />
  </div>
);

const SelectField = ({ label, options, placeholder, ...props }) => (
  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">{label}</label>
    <select
      {...props}
      className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const NewRequest = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [formData, setFormData] = useState({
    olmId: "",
    priority: "",
    useCase: "",
    useCaseDescription: "",
    volumeUnit: "",
    volume: "",
    activityFrequency: "",
    circleNumber: "",
    circleName: "",
    timeRequired: "",
    slaExpected: "",
    am: "",
    deputyM: "",
    manager: "",
    senior: "",
    oemDomain: "",
    systemsTools: "",
    activityPerformedBy: "",
    partnerName: "",
    kpiIndicators: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/usecase', formData); // Send the form data to the Flask backend
      if (response.data.success) {
        alert("Form submitted successfully!");
        // Optionally, you can redirect or clear the form here
      } else {
        alert("Error in form submission.");
      }
    } catch (error) {
      console.error("Error submitting form: ", error);
      alert("Failed to submit the form. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <Header />

        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6 text-blue-900">
            Automation Request Form
          </h1>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-md"
            onSubmit={handleSubmit}
          >
            <InputField
              label="OLM ID *"
              type="text"
              name="olmId"
              value={formData.olmId}
              onChange={handleChange}
              placeholder="Enter OLM ID"
            />
            <SelectField
              label="Priority *"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              placeholder="Select Priority"
              options={["P1", "P2", "P3", "P4"]}
            />

            <InputField
              label="Use Case *"
              type="text"
              name="useCase"
              value={formData.useCase}
              onChange={handleChange}
              placeholder="Enter Use Case"
            />
            <InputField
              label="Use Case Description *"
              type="text"
              name="useCaseDescription"
              value={formData.useCaseDescription}
              onChange={handleChange}
              placeholder="Enter Description"
            />

            <SelectField
              label="Current Volume *"
              name="volumeUnit"
              value={formData.volumeUnit}
              onChange={handleChange}
              placeholder="Select Type"
              options={[
                "Reports",
                "Transactions",
                "Incidents",
                "Nodes",
                "Services",
                "Orders",
                "Others"
              ]}
            />
            <InputField
              label="Volume *"
              type="number"
              name="volume"
              value={formData.volume}
              onChange={handleChange}
              placeholder="Enter Volume"
            />

            <SelectField
              label="Activity to be performed in a year *"
              name="activityFrequency"
              value={formData.activityFrequency}
              onChange={handleChange}
              placeholder="Select Frequency"
              options={[
                "Daily (365)",
                "Weekly (52)",
                "Monthly (12)",
                "Adhoc / Trigger Based"
              ]}
            />

            {/* Circles Involved */}
            <div className="flex flex-col gap-2">
              <label className="mb-1 font-medium text-gray-700">Circles Involved</label>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  name="circleNumber"
                  value={formData.circleNumber}
                  onChange={handleChange}
                  placeholder="Enter Circle Number"
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  name="circleName"
                  value={formData.circleName}
                  onChange={handleChange}
                  placeholder="Enter Circle Name"
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <InputField
              label="Time Required to Perform the Activity *"
              type="text"
              name="timeRequired"
              value={formData.timeRequired}
              onChange={handleChange}
              placeholder="e.g., 3 hours"
            />
            <InputField
              label="SLA Expected *"
              type="text"
              name="slaExpected"
              value={formData.slaExpected}
              onChange={handleChange}
              placeholder="e.g., 24 hours"
            />

            {/* Human Efforts */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="mb-1 font-medium text-gray-700">Human Efforts (FTE)</label>
              
              {/* Row 1 */}
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="number"
                  name="am"
                  value={formData.am}
                  onChange={handleChange}
                  placeholder="Number of Assistant Managers"
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  name="deputyM"
                  value={formData.deputyM}
                  onChange={handleChange}
                  placeholder="Number of Associate Managers"
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Row 2 */}
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="number"
                  name="manager"
                  value={formData.manager}
                  onChange={handleChange}
                  placeholder="Number of Team Leads"
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  name="senior"
                  value={formData.senior}
                  onChange={handleChange}
                  placeholder="Number of Senior Staff"
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <InputField
              label="OEM / Domain *"
              type="text"
              name="oemDomain"
              value={formData.oemDomain}
              onChange={handleChange}
              placeholder="Enter Domain"
            />
            <InputField
              label="System / Tools *"
              type="text"
              name="systemsTools"
              value={formData.systemsTools}
              onChange={handleChange}
              placeholder="Enter Tools or System"
            />

            <SelectField
              label="Activity Performed By *"
              name="activityPerformedBy"
              value={formData.activityPerformedBy}
              onChange={handleChange}
              placeholder="Select Performer"
              options={["Airtel", "Partner"]}
            />

            <InputField
              label="KPI Indicators / Benefits *"
              type="text"
              name="kpiIndicators"
              value={formData.kpiIndicators}
              onChange={handleChange}
              placeholder="Enter KPI Indicators"
            />

            {/* Submit Button */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition shadow"
              >
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

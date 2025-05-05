import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import FilterBar from './FilterBar';
import TableWithExport from './TableWithExport';

const LandingPage = () => {
  const [filters, setFilters] = useState({
    nltname: '',
    domain: '',
    processname: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const [userOptions, setUserOptions] = useState([]);
  const [domainOptions, setDomainOptions] = useState([]);
  const [processOptions, setProcessOptions] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [barChartDataToday, setBarChartDataToday] = useState([]);
  const [barChartDataMonthly, setBarChartDataMonthly] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // NEW states for additional charts
  const [barChart1Data, setBarChart1Data] = useState([]);
  const [barChart2Data, setBarChart2Data] = useState([]);

  useEffect(() => {
    fetchDropdownOptions();
    fetchMainData();
  }, []);

  const fetchDropdownOptions = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/get_domains');
      setUserOptions(res.data.users);
      setDomainOptions(res.data.domains);
      setProcessOptions(res.data.processes);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const fetchMainData = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/', {
        params: {
          username: filters.nltname,
          domain: filters.domain,
          processname: filters.processname,
          status: filters.status,
          start_date: filters.startDate,
          end_date: filters.endDate,
        },
      });

      setTableData(res.data.data);
      setHeadings(res.data.headings);
      setSuccessCount(res.data.SuccessCount);
      setFailedCount(res.data.FailedCount);
      setCurrentPage(1);

      // Today Bar Chart
      const todayChart = res.data.bardata1.map((val, idx) => ({
        label: `Today - Value ${idx + 1}`,
        Value: val[0],
      }));
      setBarChartDataToday(todayChart);

      // Monthly Bar Chart
      const monthlyChart = res.data.bardata2.map((val, idx) => ({
        label: `Month - Value ${idx + 1}`,
        Value: val[0],
      }));
      setBarChartDataMonthly(monthlyChart);

      // bardata1_full (volumes: [[...], [...]], labels: [...])
      const labels1 = res.data.bardata1_full.labels;
      const volumes1 = res.data.bardata1_full.volumes;

      const bardata1Graph = labels1.map((label, i) => {
        const obj = { label };
        volumes1.forEach((series, idx) => {
          obj[`Series${idx + 1}`] = series[i];
        });
        return obj;
      });
      setBarChart1Data(bardata1Graph);

      // bardata2_full (volumes: [[...], [...]], labels: [...])
      const labels2 = res.data.bardata2_full.labels;
      const volumes2 = res.data.bardata2_full.volumes;

      const bardata2Graph = labels2.map((label, i) => {
        const obj = { label };
        volumes2.forEach((series, idx) => {
          obj[`Series${idx + 1}`] = series[i];
        });
        return obj;
      });
      setBarChart2Data(bardata2Graph);
    } catch (error) {
      console.error('Error fetching main data:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">RPA Dashboard</h1>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        userOptions={userOptions}
        domainOptions={domainOptions}
        processOptions={processOptions}
        onSearch={fetchMainData}
      />

      {/* KPI Cards */}
      <div className="flex justify-around space-x-4">
        <div className="bg-green-100 text-green-800 font-semibold px-6 py-4 rounded shadow">
          Success: {successCount}
        </div>
        <div className="bg-red-100 text-red-800 font-semibold px-6 py-4 rounded shadow">
          Failed: {failedCount}
        </div>
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded shadow h-64">
          <h2 className="text-lg font-semibold mb-2 text-center">Today Graph</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={barChartDataToday}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-100 p-4 rounded shadow h-64">
          <h2 className="text-lg font-semibold mb-2 text-center">Monthly Graph</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={barChartDataMonthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Bar Charts */}
        <div className="bg-gray-100 p-4 rounded shadow h-64">
          <h2 className="text-lg font-semibold mb-2 text-center">Detailed Bardata1 Graph</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={barChart1Data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              {Object.keys(barChart1Data[0] || {}).filter(k => k !== 'label').map((key, idx) => (
                <Bar key={key} dataKey={key} fill={['#8884d8', '#82ca9d', '#ffc658'][idx % 3]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-100 p-4 rounded shadow h-64">
          <h2 className="text-lg font-semibold mb-2 text-center">Detailed Bardata2 Graph</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={barChart2Data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              {Object.keys(barChart2Data[0] || {}).filter(k => k !== 'label').map((key, idx) => (
                <Bar key={key} dataKey={key} fill={['#ff7300', '#387908', '#8884d8'][idx % 3]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <TableWithExport
        data={tableData}
        headings={headings}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
};

export default LandingPage;

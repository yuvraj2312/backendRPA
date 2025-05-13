import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
ResponsiveContainer,
BarChart,
Bar,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
Legend
} from 'recharts';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const LandingPage = () => {
const [filters, setFilters] = useState({
username: '',
domain: '',
processname: '',
status: '',
startDate: '',
endDate: ''
});

const areFiltersApplied = () => {
return (
filters.username ||
filters.domain ||
filters.processname ||
filters.status ||
filters.startDate ||
filters.endDate
)

}

const \[dropdownOptions, setDropdownOptions] = useState({
usernames1: \[],
domains1: \[],
processes1: \[]
});

const \[tableData, setTableData] = useState(\[]);
const \[headings, setHeadings] = useState(\[]);
const \[successCount, setSuccessCount] = useState(0);
const \[failedCount, setFailedCount] = useState(0);

const \[barChartDataToday, setBarChartDataToday] = useState(\[]);
const \[barChartDataMonthly, setBarChartDataMonthly] = useState(\[]);

const\[barChart1Data, setBarChart1Data] = useState(\[]);
const\[barChart2Data, setBarChart2Data] = useState(\[]);

const \[currentPage, setCurrentPage] = useState(1);
const rowsPerPage = 10;

const fetchDropdowns = async () => {
// console.log('fetching dropdown options');

```
try {
  const res = await axios.get('http://127.0.0.1:5000/get_domains', {
    params: {
      username: filters.username,
      domain: filters.domain,
      processname: filters.processname
    }
  });
  // console.log('dropdowns fetched:', res.data);
  
  setDropdownOptions(res.data);
} catch (error) {
  console.error('Error fetching dropdowns:', error);
}
```

};

const fetchMainData = async () => {
try {
const res = await axios.get('[http://127.0.0.1:5000/](http://127.0.0.1:5000/)', {
params: {
username: filters.username,
domain: filters.domain,
processname: filters.processname,
status: filters.status,
start\_date: filters.startDate,
end\_date: filters.endDate,
},
});

```
  const data = res?.data || {};

  // Set core table and count data with fallbacks
  setTableData(data.data || []);
  setHeadings(data.headings || []);
  setSuccessCount(data.SuccessCount || 0);
  setFailedCount(data.FailedCount || 0);
  setCurrentPage(1);

  // Today Bar Chart
  const todayChart = (data.bardata1 || []).map((val, idx) => ({
    label: `Today - Value ${idx + 1}`,
    Value: val[0] || 0,
  }));

  // Monthly Bar Chart
  const monthlyChart = (data.bardata2 || []).map((val, idx) => ({
    label: `Month - Value ${idx + 1}`,
    Value: val[0] || 0,
  }));

  setBarChartDataToday(todayChart);
  setBarChartDataMonthly(monthlyChart);

  // Construct Bar Chart 1
  const labels1 = data?.bardata11?.labels || [];
  const volumes1 = data?.bardata11?.volumes || [];

  if (labels1.length && volumes1.length && volumes1.every(v => v.length === labels1.length)) {
    const bardata1Graph = labels1.map((label, i) => {
      const obj = { label };
      volumes1.forEach((volList, idx) => {
        obj[`Series${idx + 1}`] = volList[i] || 0;
      });
      return obj;
    });
    setBarChart1Data(bardata1Graph);
  } else {
    setBarChart1Data([]);
  }

  // Construct Bar Chart 2
  const labels2 = data?.bardata22?.labels || [];
  const volumes2 = data?.bardata22?.volumes || [];

  if (labels2.length && volumes2.length && volumes2.every(v => v.length === labels2.length)) {
    const bardata2Graph = labels2.map((label, i) => {
      const obj = { label };
      volumes2.forEach((volList, idx) => {
        obj[`Series${idx + 1}`] = volList[i] || 0;
      });
      return obj;
    });
    setBarChart2Data(bardata2Graph);
```

t2Data(bardata2Graph);
} else {
setBarChart2Data(\[]);
}

```
  // Debug logs for development only
  if (process.env.NODE_ENV === 'development') {
    console.log('Main data fetched:', data);
  }
} catch (error) {
  console.error('Error fetching main data:', error);
}
```

};
useEffect(() => {
fetchDropdowns();
fetchMainData();
}, \[]);

const handleInputChange = (e) => {
setFilters({ ...filters, \[e.target.name]: e.target.value });
};

const handleSearch = () => {
// console.log("search clicked", filters);

```
fetchDropdowns();
fetchMainData();
```

};

const totalPages = Math.ceil(tableData.length / rowsPerPage);
const startIndex = (currentPage - 1) \* rowsPerPage;
const paginatedData = tableData.slice(startIndex, startIndex + rowsPerPage);

const changePage = (pageNum) => {
if (pageNum >= 1 && pageNum <= totalPages) {
setCurrentPage(pageNum);
}
};

const renderPagination = () => {
const pageNumbers = \[];
const maxPagesToShow = 5;

```
let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
let endPage = startPage + maxPagesToShow - 1;

if (endPage > totalPages) {
  endPage = totalPages;
  startPage = Math.max(1, endPage - maxPagesToShow + 1);
}

for (let i = startPage; i <= endPage; i++) {
  pageNumbers.push(i);
}

return (
  <div className="flex justify-center mt-4 space-x-2 items-center">
    <button
      onClick={() => changePage(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
    >
      Prev
    </button>

    {startPage > 1 && (
      <>
        <button
          onClick={() => changePage(1)}
          className={`px-3 py-1 rounded border ${currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          1
        </button>
        {startPage > 2 && <span className="px-2">...</span>}
      </>
    )}

    {pageNumbers.map((num) => (
      <button
        key={num}
        onClick={() => changePage(num)}
        className={`px-3 py-1 rounded border ${currentPage === num ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
      >
        {num}
      </button>
    ))}

    {endPage < totalPages && (
      <>
        {endPage < totalPages - 1 && <span className="px-2">...</span>}
        <button
          onClick={() => changePage(totalPages)}
          className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          {totalPages}
        </button>
      </>
    )}

    <button
      onClick={() => changePage(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
    >
      Next
    </button>
  </div>
);
```

};

const getCurrentMonth = () => {
const months = \[
'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
];
const currentMonth = new Date().getMonth();
return months\[currentMonth];
};

console.log("barChart1Data>>>",barChart1Data,barChart2Data)

return ( <div className="flex h-screen overflow-hidden bg-gray-50"> <Sidebar />

```
  <div className="flex flex-col flex-1 overflow-y-auto">
    <Header />

    <div className="p-6 space-y-8">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">NLT Name</label>
          <select name="username" value={filters.username} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1">
            <option value="">All</option>
            {dropdownOptions.usernames
```

1.map((user) => ( <option key={user} value={user}>{user}</option>
))} </select> </div> <div> <label className="block text-sm font-medium">Domain Name</label> <select name="domain" value={filters.domain} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1"> <option value="">All</option>
{dropdownOptions.domains1.map((domain) => ( <option key={domain} value={domain}>{domain}</option>
))} </select> </div> <div> <label className="block text-sm font-medium">Process Name</label> <select name="processname" value={filters.processname} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1"> <option value="">All</option>
{dropdownOptions.processes1.map((proc) => ( <option key={proc} value={proc}>{proc}</option>
))} </select> </div> <div> <label className="block text-sm font-medium">Status</label> <select name="status" value={filters.status} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1"> <option value="">All</option> <option value="Success">Success</option> <option value="Failed">Failed</option> </select> </div> <div> <label className="block text-sm font-medium">Start Date</label> <input type="date" name="startDate" value={filters.startDate} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1" /> </div> <div> <label className="block text-sm font-medium">End Date</label> <input type="date" name="endDate" value={filters.endDate} onChange={handleInputChange} className="w-full mt-1 border rounded px-2 py-1" /> </div> </div>

```
      <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Search
      </button>

      {/* Bar Graphs */}
      
      
      {!areFiltersApplied() ? (
        // Show Today + Monthly charts
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-100 p-4 rounded shadow h-64">
            <h2 className="text-lg font-semibold mb-2 text-center">Today - {new Date().toLocaleDateString()}</h2>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={barChartDataToday}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Value" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          
        </div>
      ) : (
        // Show Filtered bardata1 and bardata2 charts
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
```

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
          )}

```
      {/* KPI Counts */}
      <div className="flex gap-6 mt-6">
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded shadow">
          ✅ Success Count: {successCount}
        </div>
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded shadow">
          ❌ Failed Count: {failedCount}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-8">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-200 text-left">
            <tr>
              {headings.map((head, index) => (
                <th key={index} className="px-4 py-2 border">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="px-4 py-2 border">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {renderPagination()}
      </div>
    </div>
  </div>
</div>
```

);
};

export default LandingPage;



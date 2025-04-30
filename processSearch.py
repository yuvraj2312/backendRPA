@app.route('/ProcessSearch', methods=['GET', 'POST'])
def ProcessSearch():
    connection = None
    cur = None
    try:
        connection = get_connection()
        cur = connection.cursor()

        # Get filter parameters
        pn = request.form.get('Process_name', "")
        un = request.form.get('User_name', "")
        sn = request.form.get('Status_name', "")
        dn = request.form.get('Domain_name', "")
        date1 = request.form.get('date1', "")
        date2 = request.form.get('date2', "")

        # Build query dynamically based on filter criteria
        query = build_query(pn, un, sn, dn, date1, date2)
        params = build_query_params(pn, un, sn, dn, date1, date2)

        # Execute query to fetch filtered data
        cur.execute(query, params)
        fetchdata = cur.fetchall()

        # Process success and failure counts
        success_count, failure_count = calculate_counts(fetchdata)

        # Get headings for the table
        headings = get_table_headings(cur)

        # Prepare the filtered process names, domains, and NLT data for dropdowns
        dropdown_data = get_dropdown_data(cur, un, dn)

        # Add duration column to data
        finaldata = add_duration_column(fetchdata)

        # Prepare data for charts (bar and line graphs)
        bar_chart_data = prepare_bar_chart_data(finaldata)
        line_chart_data = prepare_line_chart_data(bar_chart_data)

        # Cache the processed final data for quick access
        cache.set('finaldata_key', finaldata)

        # Return the optimized response for React frontend
        return jsonify({
            'finaldata': finaldata,
            'headings': headings,
            'dropdown_data': dropdown_data,
            'success_count': success_count,
            'failure_count': failure_count,
            'bar_chart_data': bar_chart_data,
            'line_chart_data': line_chart_data,
        })

    except Exception as e:
        return jsonify({'error': str(e)})

    finally:
        if cur:
            cur.close()
        if connection:
            connection.close()


def build_query(pn, un, sn, dn, date1, date2):
    base_query = "SELECT ProcessName, NewProcessName, SME, Jira_ID, Date, ProcessType, Status, VolumeProcessed, SuccessVolume, FailedVolume, StartTime, EndTime, Output FROM [RPA_Prod_TransactionLog] "
    conditions = []

    # Filtering conditions
    if date1 and date2:
        conditions.append("Date BETWEEN ? AND ?")
    elif date1:
        conditions.append("Date >= ?")
    elif date2:
        conditions.append("Date <= ?")

    if sn:
        conditions.append("Status LIKE ?")
    if un:
        conditions.append("NLT LIKE ?")
    if dn:
        conditions.append("DomainName LIKE ?")
    if pn:
        conditions.append("NewProcessName = ?")

    if conditions:
        query = base_query + " WHERE " + " AND ".join(conditions)
    else:
        query = base_query

    query += " ORDER BY EndTime DESC"
    return query


def build_query_params(pn, un, sn, dn, date1, date2):
    params = []
    if date1:
        params.append(date1)
    if date2:
        params.append(date2)
    if sn:
        params.append(f'%{sn}%')
    if un:
        params.append(f'%{un}%')
    if dn:
        params.append(f'%{dn}%')
    if pn:
        params.append(pn)
    return params


def calculate_counts(fetchdata):
    success_count = 0
    failure_count = 0
    for record in fetchdata:
        if 'Success' in record[6]:
            success_count += 1
        elif 'Failure' in record[6]:
            failure_count += 1
    return success_count, failure_count


def get_table_headings(cur):
    cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='RPA_Prod_TransactionLog'")
    headings = [i[0] for i in cur.fetchall()]
    return headings


def get_dropdown_data(cur, un, dn):
    # Fetch distinct process names, domains, and NLT for dropdown filters
    cur.execute("SELECT DISTINCT NewProcessName FROM Prod_NLT_List WHERE NLT LIKE ? AND DomainName LIKE ?", [f'%{un}%', f'%{dn}%'])
    process_names = [row[0] for row in cur.fetchall()]

    cur.execute("SELECT DISTINCT NLT FROM Prod_NLT_List")
    nlt = [row[0] for row in cur.fetchall()]

    cur.execute("SELECT DISTINCT DomainName FROM Prod_NLT_List")
    domains = [row[0] for row in cur.fetchall()]

    return {'process_names': process_names, 'nlt': nlt, 'domains': domains}


def add_duration_column(fetchdata):
    def time_difference(start, end):
        try:
            start_time = datetime.strptime(start, '%d-%m-%Y %H:%M:%S')
            end_time = datetime.strptime(end, '%d-%m-%Y %H:%M:%S')
            return str(end_time - start_time)
        except:
            return "NA"

    finaldata = []
    for record in fetchdata:
        record = list(record)
        duration = time_difference(record[9], record[10])
        record.insert(11, duration)  # Insert duration
        finaldata.append(record)
    return finaldata


def prepare_bar_chart_data(finaldata):
    # Prepare data for bar graph: Volume Processed, Success Volume, and Failed Volume
    bar_data = {"process_name": [], "volume_processed": [], "success_volume": [], "failed_volume": []}
    for record in finaldata:
        if record[4]:  # If process name is not empty
            bar_data["process_name"].append(record[4])
            bar_data["volume_processed"].append(record[7])
            bar_data["success_volume"].append(record[8])
            bar_data["failed_volume"].append(record[9])

    return bar_data


def prepare_line_chart_data(bar_data):
    # Prepare data for line graph by grouping by months (based on bar_data)
    line_data = {"month": [], "volume_processed": [], "success_volume": [], "failed_volume": []}
    # (This logic can be expanded to group by month and aggregate data)
    return line_data

@app.route('/', methods=['GET'])
@token_required
def index():
    connection = None
    cur = None
    try:
        page = int(request.args.get('page', 1))
        per_page = 20
        offset = (page - 1) * per_page

        connection = get_connection()
        cur = connection.cursor()

        TableName = "[ProcessData].[dbo].[RPA_Prod_TransactionLog]"

        # Fetch transactional processes
        transactional_query = f"""
        SELECT 
            ProcessName, Date, ProcessType, Status, VolumeProcessed, 
            SuccessVolume, FailedVolume, StartTime, EndTime, Output
        FROM {TableName}
        WHERE 
            Date = CONVERT(VARCHAR, GETDATE(), 105) AND
            ProcessType LIKE '%Transactional%' AND
            Status NOT LIKE '%Progress%'
        ORDER BY [End Time] DESC
        """
        cur.execute(transactional_query)
        transactional_data = cur.fetchall()

        # Fetch non-transactional latest processes (one per ProcessName per Date)
        non_transactional_query = f"""
        WITH CTE AS (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY Date, ProcessName ORDER BY StartTime DESC) AS rn
            FROM {TableName}
            WHERE 
                Date = CONVERT(VARCHAR, GETDATE(), 105) AND
                ProcessType NOT LIKE '%Transactional%'
        )
        SELECT 
            ProcessName, Date, ProcessType, Status, VolumeProcessed, 
            SuccessVolume, FailedVolume, StartTime, EndTime, Output
        FROM CTE
        WHERE rn = 1 AND Status NOT LIKE '%Progress%'
        ORDER BY [End Time] DESC
        """
        cur.execute(non_transactional_query)
        non_transactional_data = cur.fetchall()

        # Merge transactional and non-transactional data
        all_data = transactional_data + non_transactional_data

        # Sort based on End Time descending
        def parse_time(ts):
            try:
                return datetime.strptime(ts, '%d-%m-%Y %H:%M:%S')
            except:
                return datetime.min

        all_data = sorted(all_data, key=lambda x: parse_time(x[8]), reverse=True)  # x[8] is EndTime

        # Success and Failed counts
        cur.execute(f"""
        SELECT COUNT(*)
        FROM {TableName}
        WHERE 
            Date = CONVERT(VARCHAR, GETDATE(), 105) AND
            Status LIKE '%Success%' AND
            Status NOT LIKE '%Progress%'
        """)
        success_count = cur.fetchone()[0]

        cur.execute(f"""
        SELECT COUNT(*)
        FROM {TableName}
        WHERE 
            Date = CONVERT(VARCHAR, GETDATE(), 105) AND
            Status LIKE '%Fail%' AND
            Status NOT LIKE '%Progress%'
        """)
        fail_count = cur.fetchone()[0]

        # Fetch dropdown values (live)
        cur.execute("SELECT DISTINCT NLT FROM [Prod_NLT_List]")
        nlt_list = [row[0] for row in cur.fetchall()]

        cur.execute("SELECT DISTINCT DomainName FROM [Prod_NLT_List]")
        domain_list = [row[0] for row in cur.fetchall()]

        cur.execute("SELECT DISTINCT NewProcessName FROM [Prod_NLT_List]")
        process_list = [row[0] for row in cur.fetchall()]

        # Prepare table headings (dynamic from DB)
        cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RPA_Dashboard_Table_Header'")
        headings = [row[0] for row in cur.fetchall()]

        headings.insert(0, "S.No")
        headings.insert(11, "Duration")

        # Prepare finaldata for table rendering
        finaldata = []
        s_no = 1
        for record in all_data:
            record = list(record)
            start_time = record[7]
            end_time = record[8]
            duration = time_difference(start_time, end_time)
            record.insert(11, duration)
            record.insert(0, s_no)
            finaldata.append(record)
            s_no += 1

        # Prepare bar chart data: volume per ProcessName
        bardata_query = f"""
        SELECT ProcessName, 
               SUM(VolumeProcessed), 
               SUM(SuccessVolume), 
               SUM(FailedVolume)
        FROM {TableName}
        WHERE 
            Date = CONVERT(VARCHAR, GETDATE(), 105) AND
            Status NOT LIKE '%Progress%'
        GROUP BY ProcessName
        """
        cur.execute(bardata_query)
        bar_chart_data = cur.fetchall()

        l2 = []  # Process Names
        bd = [[], [], []]  # Volumes [processed, success, failed]

        for process in bar_chart_data:
            l2.append(process[0])
            bd[0].append(process[1] or 0)
            bd[1].append(process[2] or 0)
            bd[2].append(process[3] or 0)

        # Prepare line chart data: monthwise volumes
        line_query = f"""
        SELECT 
            FORMAT(CONVERT(DATE, Date, 105), 'yyyy-MM') as MonthYear,
            SUM(VolumeProcessed),
            SUM(SuccessVolume),
            SUM(FailedVolume)
        FROM {TableName}
        WHERE
            Status NOT LIKE '%Progress%'
        GROUP BY FORMAT(CONVERT(DATE, Date, 105), 'yyyy-MM')
        ORDER BY MonthYear ASC
        """
        cur.execute(line_query)
        line_chart_data = cur.fetchall()

        l1 = []  # Month-Year
        ld = [[], [], []]  # Volumes [processed, success, failed]

        for month in line_chart_data:
            l1.append(month[0])
            ld[0].append(month[1] or 0)
            ld[1].append(month[2] or 0)
            ld[2].append(month[3] or 0)

        # Clear and set cache if needed (optional)
        cache.delete('finaldata_key')
        cache.set('finaldata_key', finaldata)

        return render_template('index.html', 
                               l1=l1, l2=l2,
                               linedata=ld, bardata=bd,
                               data=finaldata,
                               p_n=process_list,
                               u_n=nlt_list,
                               d_n=domain_list,
                               headings=headings,
                               SuccessCount=success_count,
                               FailedCount=fail_count)

    finally:
        if cur:
            cur.close()
        if connection:
            connection.close()

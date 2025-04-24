@app.route('/', methods=['GET', 'POST'])
@token_required
def index():
    connection = None
    cur = None
    try:
        # ─── Pagination Setup ───────────────────────────────────────────
        page = int(request.args.get('page', 1))     # Get current page from query params
        per_page = 20                               # Set number of records per page
        offset = (page - 1) * per_page              # Calculate offset for slicing

        connection = get_connection()
        cur = connection.cursor()

        table = "[PD].[db].[RPD]"

        # ─── Column Selections for Query ───────────────────────────────
        RCols = ("[CTE].ProcessName AS 'Process Name', [Prod_NLT_List].NewProcessName, "
                 "COALESCE([Prod_NLT_List].SME, 'NA') AS 'Process Owner', [Jira_ID] AS 'Jira ID', "
                 "[CTE].Date, [CTE].ProcessType AS 'Process Type', [CTE].Status, [CTE].VolumeProcessed AS 'Volume Processed', "
                 "[CTE].SuccessVolume AS 'Success Volume', [CTE].FailedVolume AS 'Failed Volume', [CTE].StartTime AS 'Start Time', "
                 "[CTE].EndTime AS 'End Time', [CTE].Output AS 'Output'")

        TCols = (f"{table}.ProcessName AS 'Process Name', [Prod_NLT_List].NewProcessName, "
                 f"COALESCE([Prod_NLT_List].SME, 'NA') AS 'Process Owner', [Jira_ID] AS 'Jira ID', {table}.Date, "
                 f"{table}.ProcessType AS 'Process Type', {table}.Status, {table}.VolumeProcessed AS 'Volume Processed', "
                 f"{table}.SuccessVolume AS 'Success Volume', {table}.FailedVolume AS 'Failed Volume', {table}.StartTime AS 'Start Time', "
                 f"{table}.EndTime AS 'End Time', {table}.Output AS 'Output'")

        # ─── Transactional Data Query ───────────────────────────────────
        query1 = (f"SELECT {TCols} FROM {table} LEFT JOIN [Prod_NLT_List] ON {table}.ProcessName = [Prod_NLT_List].ProcessName "
                  f"WHERE Date = CONVERT(VARCHAR, GETDATE(), 105) AND [ProcessType] LIKE '%Transactional%' "
                  f"AND [Status] NOT LIKE '%Progress%' ORDER BY [End Time] DESC")
        cur.execute(query1)
        fetchdata = cur.fetchall()

        # ─── Recurrent Data Query ───────────────────────────────────────
        query2 = (f"WITH CTE AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY Date, ProcessName ORDER BY StartTime DESC) AS rn "
                  f"FROM {table} WHERE Date = CONVERT(VARCHAR, GETDATE(), 105) AND [ProcessType] NOT LIKE '%Transactional%') "
                  f"SELECT {RCols} FROM CTE LEFT JOIN [Prod_NLT_List] ON CTE.ProcessName = [Prod_NLT_List].ProcessName "
                  f"WHERE rn = 1 AND [Status] NOT LIKE '%Progress%' ORDER BY [End Time] DESC")
        cur.execute(query2)
        fetchdata += cur.fetchall()  # Merge both transactional + recurrent

        # ─── Sort Combined Data by End Time ─────────────────────────────
        def parse_time(ts):
            try:
                return datetime.strptime(ts, '%d-%m-%Y %H:%M:%S')
            except:
                return datetime.min

        fetchdata.sort(key=lambda x: parse_time(x[10]), reverse=True)

        # ─── Column Headings ────────────────────────────────────────────
        cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='RPA_Dashboard_Table_Header'")
        headings = [row[0] for row in cur.fetchall()]
        headings.insert(11, "Duration")
        headings.insert(0, "S.No")

        # ─── KPI Count Queries ──────────────────────────────────────────
        def get_count(q):
            cur.execute(q)
            return len(cur.fetchall())

        success_count = get_count(f"SELECT * FROM {table} WHERE Date = CONVERT(VARCHAR, GETDATE(), 105) "
                                  f"AND [ProcessType] LIKE '%Transactional%' AND [Status] LIKE '%Success%' AND [Status] NOT LIKE '%Progress%'")
        success_count += get_count(f"WITH CTE AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY Date, ProcessName ORDER BY StartTime DESC) AS rn "
                                   f"FROM {table} WHERE Date = CONVERT(VARCHAR, GETDATE(), 105) AND [ProcessType] NOT LIKE '%Transactional%' AND [ProcessType] IS NOT NULL) "
                                   f"SELECT * FROM CTE WHERE rn = 1 AND [Status] LIKE '%Success%' AND [Status] NOT LIKE '%Progress%'")

        failed_count = get_count(f"SELECT * FROM {table} WHERE Date = CONVERT(VARCHAR, GETDATE(), 105) "
                                 f"AND [ProcessType] LIKE '%Transactional%' AND [Status] LIKE '%Fail%' AND [Status] NOT LIKE '%Progress%'")
        failed_count += get_count(f"WITH CTE AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY Date, ProcessName ORDER BY StartTime DESC) AS rn "
                                  f"FROM {table} WHERE Date = CONVERT(VARCHAR, GETDATE(), 105) AND [ProcessType] NOT LIKE '%Transactional%' AND [ProcessType] IS NOT NULL) "
                                  f"SELECT * FROM CTE WHERE rn = 1 AND [Status] LIKE '%Fail%' AND [Status] NOT LIKE '%Progress%'")

        # ─── Dropdown Data ──────────────────────────────────────────────
        def get_distinct(col):
            cur.execute(f"SELECT DISTINCT({col}) FROM [Prod_NLT_List]")
            return [row[0] for row in cur.fetchall() if row[0]]

        p_n = get_distinct("NewProcessName")
        u_n = get_distinct("NLT")
        d_n = get_distinct("DomainName")

        # ─── Construct Final Data with Duration ─────────────────────────
        finaldata = []
        for i, row in enumerate(fetchdata):
            fd = list(row)
            fd.pop(0) if len(fd) > 13 else None  # Remove redundant column if exists
            try:
                duration = time_difference(fd[9], fd[10])
            except:
                duration = "NA"
            fd.insert(11, duration)
            fd.insert(0, i + 1)  # Add serial number
            finaldata.append(fd)

        # ─── Bar Graph Data Aggregation ────────────────────────────────
        bd_dic = {}
        for row in finaldata:
            date_key = row[4]
            try:
                vp, sv, fv = int(row[7]), int(row[8]), int(row[9])
                if date_key not in bd_dic:
                    bd_dic[date_key] = [vp, sv, fv]
                else:
                    bd_dic[date_key][0] += vp
                    bd_dic[date_key][1] += sv
                    bd_dic[date_key][2] += fv
            except:
                continue

        l2, bd = list(bd_dic.keys()), [[], [], []]
        for k in l2:
            for i in range(3):
                bd[i].append(bd_dic[k][i])

        # ─── Line Graph Data Aggregation ───────────────────────────────
        month_map = {"01": "January", "02": "February", "03": "March", "04": "April", "05": "May", "06": "June",
                     "07": "July", "08": "August", "09": "September", "10": "October", "11": "November", "12": "December"}

        ld_dic = {}
        for date in l2:
            month = month_map.get(date[3:5], "")
            if month:
                if month not in ld_dic:
                    ld_dic[month] = bd_dic[date][:]
                else:
                    for i in range(3):
                        ld_dic[month][i] += bd_dic[date][i]

        l1, ld = list(ld_dic.keys()), [[], [], []]
        for m in l1:
            for i in range(3):
                ld[i].append(ld_dic[m][i])

        # ─── Paginate Final Data ───────────────────────────────────────
        total_records = len(finaldata)
        total_pages = (total_records + per_page - 1) // per_page
        paginated_data = finaldata[offset:offset + per_page]

        # ─── Cache Final Data ──────────────────────────────────────────
        cache.delete('finaldata_key')
        cache.set('finaldata_key', finaldata)

        # ─── Return JSON Response ──────────────────────────────────────
        return jsonify({
            'kpi': {
                'success': success_count,
                'fail': failed_count
            },
            'bar': {
                'labels': l2,
                'data': bd
            },
            'line': {
                'labels': l1,
                'data': ld
            },
            'dropdowns': {
                'process_names': p_n,
                'usernames': u_n,
                'domains': d_n
            },
            'headings': headings,
            'data': paginated_data,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'per_page': per_page,
                'total_records': total_records
            }
        })

    finally:
        if cur: cur.close()
        if connection: connection.close()

@app.route('/', methods=['GET', 'POST'])
def index():
    connection = None
    cur = None
    try:
        # Determine if the request is for filtered data (ProcessSearch)
        filter_request = bool(request.args.get('Process_name') or request.args.get('User_name') or request.args.get('Status_name') or request.args.get('Domain_name') or request.args.get('date1') or request.args.get('date2'))
        
        if not filter_request:
            # Default landing page logic (without filters)
            page = int(request.args.get('page', 1))
            per_page = 20
            offset = (page - 1) * per_page

            connection = get_connection()
            cur = connection.cursor()

            table = "[ProcessData].[dbo].[RPA_Prod_TransactionLog]"
            join_clause = f"LEFT JOIN [Prod_NLT_List] ON {table}.ProcessName = [Prod_NLT_List].ProcessName"

            base_columns = [
                f"{table}.ProcessName AS 'Process Name'",
                "[Prod_NLT_List].NewProcessName",
                "COALESCE([Prod_NLT_List].SME, 'NA') AS 'Process Owner'",
                "[Jira_ID] AS 'Jira ID'",
                f"{table}.Date",
                f"{table}.ProcessType AS 'Process Type'",
                f"{table}.Status",
                f"{table}.VolumeProcessed AS 'Volume Processed'",
                f"{table}.SuccessVolume AS 'Success Volume'",
                f"{table}.FailedVolume AS 'Failed Volume'",
                f"{table}.StartTime AS 'Start Time'",
                f"{table}.EndTime AS 'End Time'",
                f"{table}.Output AS 'Output'"
            ]
            column_selection = ', '.join(base_columns)

            # Transactional Query
            transactional_query = f"""
                SELECT {column_selection}
                FROM {table}
                {join_clause}
                WHERE Date = CONVERT(VARCHAR, GETDATE(), 105)
                  AND [ProcessType] LIKE '%Transactional%'
                  AND [Status] NOT LIKE '%Progress%'
                ORDER BY [End Time] DESC
            """
            cur.execute(transactional_query)
            fetchdata = cur.fetchall()

            # Non-Transactional Query (Latest entries)
            cte_column_selection = column_selection.replace(table, '[CTE]')
            non_transactional_query = f"""
                WITH CTE AS (
                    SELECT *, ROW_NUMBER() OVER (
                        PARTITION BY Date, ProcessName ORDER BY StartTime DESC
                    ) AS rn
                    FROM {table}
                    WHERE Date = CONVERT(VARCHAR, GETDATE(), 105)
                      AND [ProcessType] NOT LIKE '%Transactional%'
                )
                SELECT {cte_column_selection}
                FROM CTE
                {join_clause.replace(table, 'CTE')}
                WHERE rn = 1 AND [Status] NOT LIKE '%Progress%'
                ORDER BY [End Time] DESC
            """
            cur.execute(non_transactional_query)
            fetchdata += cur.fetchall()

            # Time sort
            def parse_time(timestamp):
                try:
                    return datetime.strptime(timestamp, '%d-%m-%Y %H:%M:%S')
                except:
                    return datetime.min

            fetchdata.sort(key=lambda row: parse_time(row[10]), reverse=True)

            # Success & Failed Count Queries
            def get_count(query):
                cur.execute(query)
                return len(cur.fetchall())

            TSuccessCount = f"""
                SELECT 1 FROM {table}
                WHERE Date = CONVERT(VARCHAR, GETDATE(), 105)
                  AND [ProcessType] LIKE '%Transactional%'
                  AND [Status] LIKE '%Success%'
                  AND [Status] NOT LIKE '%Progress%'
            """
            TFailedCount = TSuccessCount.replace("Success", "Fail")

            RSuccessCount = f"""
                WITH CTE AS (
                    SELECT *, ROW_NUMBER() OVER (
                        PARTITION BY Date, ProcessName ORDER BY StartTime DESC
                    ) AS rn
                    FROM {table}
                    WHERE Date = CONVERT(VARCHAR, GETDATE(), 105)
                      AND [ProcessType] NOT LIKE '%Transactional%' AND [ProcessType] IS NOT NULL
                )
                SELECT 1 FROM CTE
                WHERE rn = 1 AND [Status] LIKE '%Success%' AND [Status] NOT LIKE '%Progress%'
            """
            RFailedCount = RSuccessCount.replace("Success", "Fail")

            SuccessCount = get_count(TSuccessCount) + get_count(RSuccessCount)
            FailedCount = get_count(TFailedCount) + get_count(RFailedCount)

            # Fetch headings
            cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='RPA_Dashboard_Table_Header'")
            headings = [row[0] for row in cur.fetchall()]

            # Dropdown data
            def get_unique_list(column):
                cur.execute(f"SELECT DISTINCT({column}) FROM [Prod_NLT_List]")
                return list({row[0] for row in cur.fetchall() if row[0]})

            p_n = get_unique_list("NewProcessName")
            u_n = get_unique_list("NLT")
            d_n = get_unique_list("DomainName")

            # Final data processing
            finaldata = []
            for row in fetchdata:
                fd = list(row)
                fd.pop(0)  # Remove ProcessName if not needed
                if len(fd) == 14:
                    fd.pop()  # Remove extra field
                try:
                    fd.insert(11, time_difference(fd[9], fd[10]))
                except:
                    fd.insert(11, "NA")
                finaldata.append(fd)

            headings.insert(11, "Duration")
            for i, row in enumerate(finaldata, start=1):
                row.insert(0, i)
            headings.insert(0, "S.No")

            # Bar Chart 1 (by ProcessName)
            bd_dic = {}
            for row in finaldata:
                key = row[4]  # Process Name
                if not key:
                    continue
                try:
                    vp, sv, fv = int(row[7]), int(row[8]), int(row[9])
                    if key not in bd_dic:
                        bd_dic[key] = [vp, sv, fv]
                    else:
                        bd_dic[key][0] += vp
                        bd_dic[key][1] += sv
                        bd_dic[key][2] += fv
                except:
                    continue

            l2 = list(bd_dic.keys())
            bardata1 = [[vals[i] for vals in bd_dic.values()] for i in range(3)]

            # Bar Chart 2 (by Month)
            dtm = {
                "01": "January", "02": "February", "03": "March",
                "04": "April", "05": "May", "06": "June",
                "07": "July", "08": "August", "09": "September",
                "10": "October", "11": "November", "12": "December"
            }
            ld_dic = {}
            for i, key in enumerate(l2):
                month = dtm.get(key[3:5])
                if not month:
                    continue
                if month not in ld_dic:
                    ld_dic[month] = [bardata1[0][i], bardata1[1][i], bardata1[2][i]]
                else:
                    ld_dic[month][0] += bardata1[0][i]
                    ld_dic[month][1] += bardata1[1][i]
                    ld_dic[month][2] += bardata1[2][i]

            l3 = list(ld_dic.keys())
            bardata2 = [[vals[i] for vals in ld_dic.values()] for i in range(3)]

            # Cache
            cache.delete('finaldata_key')
            cache.set('finaldata_key', finaldata)

            return jsonify({
                'l2': l2,            # Bar Chart 1 labels (Process Names)
                'bardata1': bardata1,  # Bar Chart 1 data
                'l3': l3,            # Bar Chart 2 labels (Months)
                'bardata2': bardata2,  # Bar Chart 2 data
                'data': finaldata,     # Table data
                'p_n': p_n,            # Dropdown: Process Names
                'u_n': u_n,            # Dropdown: NLT Names
                'd_n': d_n,            # Dropdown: Domain Names
                'headings': headings,  # Table headings
                'SuccessCount': SuccessCount,
                'FailedCount': FailedCount,
            })
        
        else:
            # Process Search (filtered data) logic

            # Fetch the filter parameters from the request
            process_name = request.args.get('Process_name')
            user_name = request.args.get('User_name')
            status_name = request.args.get('Status_name')
            domain_name = request.args.get('Domain_name')
            start_date = request.args.get('date1')
            end_date = request.args.get('date2')

            connection = get_connection()
            cur = connection.cursor()

            table = "[ProcessData].[dbo].[RPA_Prod_TransactionLog]"
            join_clause = f"LEFT JOIN [Prod_NLT_List] ON {table}.ProcessName = [Prod_NLT_List].ProcessName"

            # Base columns selection
            base_columns = [
                f"{table}.ProcessName AS 'Process Name'",
                "[Prod_NLT_List].NewProcessName",
                "COALESCE([Prod_NLT_List].SME, 'NA') AS 'Process Owner'",
                "[Jira_ID] AS 'Jira ID'",
                f"{table}.Date",
                f"{table}.ProcessType AS 'Process Type'",
                f"{table}.Status",
                f"{table}.VolumeProcessed AS 'Volume Processed'",
                f"{table}.SuccessVolume AS 'Success Volume'",
                f"{table}.FailedVolume AS 'Failed Volume'",
                f"{table}.StartTime AS 'Start Time'",
                f"{table}.EndTime AS 'End Time'",
                f"{table}.Output AS 'Output'"
            ]
            column_selection = ', '.join(base_columns)

            # Build the WHERE clause based on the filters
            where_clause = "WHERE 1=1"
            if process_name:
                where_clause += f" AND {table}.ProcessName = '{process_name}'"
            if user_name:
                where_clause += f" AND [Prod_NLT_List].NLT = '{user_name}'"
            if status_name:
                where_clause += f" AND {table}.Status = '{status_name}'"
            if domain_name:
                where_clause += f" AND [Prod_NLT_List].DomainName = '{domain_name}'"
            if start_date:
                where_clause += f" AND {table}.Date >= '{start_date}'"
            if end_date:
                where_clause += f" AND {table}.Date <= '{end_date}'"

            # Transactional Query
            transactional_query = f"""
                SELECT {column_selection}
                FROM {table}
                {join_clause}
                {where_clause}
                AND [ProcessType] LIKE '%Transactional%'
                AND [Status] NOT LIKE '%Progress%'
                ORDER BY [End Time] DESC
            """
            cur.execute(transactional_query)
            fetchdata = cur.fetchall()

            # Non-Transactional Query (Latest entries)
            cte_column_selection = column_selection.replace(table, '[CTE]')
            non_transactional_query = f"""
                WITH CTE AS (
                    SELECT *, ROW_NUMBER() OVER (
                        PARTITION BY Date, ProcessName ORDER BY StartTime DESC
                    ) AS rn
                    FROM {table}
                    {where_clause}
                    AND [ProcessType] NOT LIKE '%Transactional%' AND [ProcessType] IS NOT NULL
                )
                SELECT {cte_column_selection}
                FROM CTE
                {join_clause.replace(table, 'CTE')}
                WHERE rn = 1 AND [Status] NOT LIKE '%Progress%'
                ORDER BY [End Time] DESC
            """
            cur.execute(non_transactional_query)
            fetchdata += cur.fetchall()

            # Time sort
            def parse_time(timestamp):
                try:
                    return datetime.strptime(timestamp, '%d-%m-%Y %H:%M:%S')
                except:
                    return datetime.min

            fetchdata.sort(key=lambda row: parse_time(row[10]), reverse=True)

            # Success & Failed Count Queries (same as above)
            def get_count(query):
                cur.execute(query)
                return len(cur.fetchall())

            TSuccessCount = f"""
                SELECT 1 FROM {table}
                {where_clause}
                AND [ProcessType] LIKE '%Transactional%'
                AND [Status] LIKE '%Success%'
                AND [Status] NOT LIKE '%Progress%'
            """
            TFailedCount = TSuccessCount.replace("Success", "Fail")

            RSuccessCount = f"""
                WITH CTE AS (
                    SELECT *, ROW_NUMBER() OVER (
                        PARTITION BY Date, ProcessName ORDER BY StartTime DESC
                    ) AS rn
                    FROM {table}
                    {where_clause}
                    AND [ProcessType] NOT LIKE '%Transactional%' AND [ProcessType] IS NOT NULL
                )
                SELECT 1 FROM CTE
                WHERE rn = 1 AND [Status] LIKE '%Success%' AND [Status] NOT LIKE '%Progress%'
            """
            RFailedCount = RSuccessCount.replace("Success", "Fail")

            SuccessCount = get_count(TSuccessCount) + get_count(RSuccessCount)
            FailedCount = get_count(TFailedCount) + get_count(RFailedCount)

            # Fetch headings (same as above)
            cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='RPA_Dashboard_Table_Header'")
            headings = [row[0] for row in cur.fetchall()]

            # Dropdown data (same as above)
            def get_unique_list(column):
                cur.execute(f"SELECT DISTINCT({column}) FROM [Prod_NLT_List]")
                return list({row[0] for row in cur.fetchall() if row[0]})

            p_n = get_unique_list("NewProcessName")
            u_n = get_unique_list("NLT")
            d_n = get_unique_list("DomainName")

            # Final data processing (same as above)
            finaldata = []
            for row in fetchdata:
                fd = list(row)
                fd.pop(0)  # Remove ProcessName if not needed
                if len(fd) == 14:
                    fd.pop()  # Remove extra field
                try:
                    fd.insert(11, time_difference(fd[9], fd[10]))
                except:
                    fd.insert(11, "NA")
                finaldata.append(fd)

            headings.insert(11, "Duration")
            for i, row in enumerate(finaldata, start=1):
                row.insert(0, i)
            headings.insert(0, "S.No")

            # Bar Chart 1 (Dynamic: By ProcessName or another field)
            group_by_field = "ProcessName" if process_name else "DomainName"  # Adjust based on the filters
            bd_dic = {}
            for row in finaldata:
                key = row[4] if group_by_field == "ProcessName" else row[14]  # Group by ProcessName or DomainName
                if not key:
                    continue
                try:
                    vp, sv, fv = int(row[7]), int(row[8]), int(row[9])
                    if key not in bd_dic:
                        bd_dic[key] = [vp, sv, fv]
                    else:
                        bd_dic[key][0] += vp
                        bd_dic[key][1] += sv
                        bd_dic[key][2] += fv
                except:
                    continue

            l2 = list(bd_dic.keys())
            bardata1 = [[vals[i] for vals in bd_dic.values()] for i in range(3)]

            # Bar Chart 2 (Dynamic: Group by Month)
            dtm = {
                "01": "January", "02": "February", "03": "March",
                "04": "April", "05": "May", "06": "June",
                "07": "July", "08": "August", "09": "September",
                "10": "October", "11": "November", "12": "December"
            }
            ld_dic = {}
            for i, key in enumerate(l2):
                month = dtm.get(key[3:5])
                if not month:
                    continue
                if month not in ld_dic:
                    ld_dic[month] = [bardata1[0][i], bardata1[1][i], bardata1[2][i]]
                else:
                    ld_dic[month][0] += bardata1[0][i]
                    ld_dic[month][1] += bardata1[1][i]
                    ld_dic[month][2] += bardata1[2][i]

            l3 = list(ld_dic.keys())
            bardata2 = [[vals[i] for vals in ld_dic.values()] for i in range(3)]

            # Cache
            cache.delete('finaldata_key')
            cache.set('finaldata_key', finaldata)

            return jsonify({
                'l2': l2,            # Bar Chart 1 labels (Process Names or Domain Names)
                'bardata1': bardata1,  # Bar Chart 1 data
                'l3': l3,            # Bar Chart 2 labels (Months)
                'bardata2': bardata2,  # Bar Chart 2 data
                'data': finaldata,     # Table data
                'p_n': p_n,            # Dropdown: Process Names
                'u_n': u_n,            # Dropdown: NLT Names
                'd_n': d_n,            # Dropdown: Domain Names
                'headings': headings,  # Table headings
                'SuccessCount': SuccessCount,
                'FailedCount': FailedCount,
            })


    finally:
        if cur:
            cur.close()
        if connection:
            connection.close()

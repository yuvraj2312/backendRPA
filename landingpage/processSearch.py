@app.route('/', methods=['GET', 'POST'])
def index():
    connection = None
    cur = None
    try:
        # Determine if the request is for filtered data (ProcessSearch)
        filter_request = bool(request.args.get('processname') or request.args.get('username') or request.args.get('status') or request.args.get('domain') or request.args.get('start_date') or request.args.get('end_date'))
        
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
        
        else:            # Process Search (filtered data) logic

            process_name = request.args.get('processname')
            user_name = request.args.get('username')
            status_name = request.args.get('status')
            domain_name = request.args.get('domain')
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')

            connection = get_connection()
            cur = connection.cursor()

            table = "[ProcessData].[dbo].[RPA_Prod_TransactionLog]"
            join_clause = f"LEFT JOIN [ProcessData].[dbo].[Prod_NLT_List] AS PNL ON {table}.ProcessName = PNL.ProcessName"

            base_columns = [
                f"{table}.ProcessName AS 'Process Name'",
                "PNL.NewProcessName",
                "COALESCE(PNL.SME, 'NA') AS 'Process Owner'",
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

            transactional_where = "WHERE 1=1"
            if process_name:
                transactional_where += f" AND {table}.ProcessName = '{process_name}'"
            if status_name:
                transactional_where += f" AND {table}.Status = '{status_name}'"
            if start_date:
                transactional_where += f" AND CAST({table}.Date AS DATE) >= CAST('{start_date}' AS DATE)"
            if end_date:
                transactional_where += f" AND CAST({table}.Date AS DATE) <= CAST('{end_date}' AS DATE)"

            post_join_conditions = ""
            if user_name:
                post_join_conditions += f" AND PNL.NLT = '{user_name}'"
            if domain_name:
                post_join_conditions += f" AND PNL.DomainName = '{domain_name}'"

            transactional_query = f"""
                SELECT {column_selection}
                FROM {table}
                {join_clause}
                {transactional_where}
                AND {table}.ProcessType LIKE '%Transactional%'
                AND {table}.Status NOT LIKE '%Progress%'
                {post_join_conditions}
                ORDER BY {table}.EndTime DESC
            """
            cur.execute(transactional_query)
            fetchdata = cur.fetchall()

            # For non-transactional (CTE) query
            log_filters = "WHERE 1=1"
            if process_name:
                log_filters += f" AND {table}.ProcessName = '{process_name}'"
            if status_name:
                log_filters += f" AND {table}.Status = '{status_name}'"
            if start_date:
                log_filters += f" AND CAST({table}.Date AS DATE) >= CAST('{start_date}' AS DATE)"
            if end_date:
                log_filters += f" AND CAST({table}.Date AS DATE) <= CAST('{end_date}' AS DATE)"

            cte_column_selection = column_selection.replace(table, 'CTE')

            non_transactional_query = f"""
                WITH CTE AS (
                    SELECT *, ROW_NUMBER() OVER (
                        PARTITION BY Date, ProcessName ORDER BY StartTime DESC
                    ) AS rn
                    FROM {table}
                    {log_filters}
                    AND ProcessType NOT LIKE '%Transactional%' AND ProcessType IS NOT NULL
                )
                SELECT {cte_column_selection}
                FROM CTE
                LEFT JOIN [ProcessData].[dbo].[Prod_NLT_List] AS PNL ON CTE.ProcessName = PNL.ProcessName
                WHERE rn = 1
                AND CTE.Status NOT LIKE '%Progress%'
                {post_join_conditions}
                ORDER BY CTE.EndTime DESC
            """
            cur.execute(non_transactional_query)
            fetchdata += cur.fetchall()

            def parse_time(timestamp):
                try:
                    return datetime.strptime(timestamp, '%d-%m-%Y %H:%M:%S')
                except:
                    return datetime.min

            fetchdata.sort(key=lambda row: parse_time(row[10]), reverse=True)

            where_clause = transactional_where
            def get_count(query):
                cur.execute(query)
                return len(cur.fetchall())

            TSuccessCount = f"""
                SELECT 1 FROM {table}
                {where_clause}
                AND ProcessType LIKE '%Transactional%'
                AND Status LIKE '%Success%'
                AND Status NOT LIKE '%Progress%'
            """
            TFailedCount = TSuccessCount.replace("Success", "Fail")

            RSuccessCount = f"""
                WITH CTE AS (
                    SELECT *, ROW_NUMBER() OVER (
                        PARTITION BY Date, ProcessName ORDER BY StartTime DESC
                    ) AS rn
                    FROM {table}
                    {log_filters}
                    AND ProcessType NOT LIKE '%Transactional%' AND ProcessType IS NOT NULL
                )
                SELECT 1 FROM CTE
                WHERE rn = 1 AND Status LIKE '%Success%' AND Status NOT LIKE '%Progress%'
            """
            RFailedCount = RSuccessCount.replace("Success", "Fail")

            SuccessCount = get_count(TSuccessCount) + get_count(RSuccessCount)
            FailedCount = get_count(TFailedCount) + get_count(RFailedCount)

            cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='RPA_Dashboard_Table_Header'")
            headings = [row[0] for row in cur.fetchall()]

            def get_unique_list(column):
                cur.execute(f"SELECT DISTINCT({column}) FROM [ProcessData].[dbo].[Prod_NLT_List]")
                return list({row[0] for row in cur.fetchall() if row[0]})

            p_n = get_unique_list("NewProcessName")
            u_n = get_unique_list("NLT")
            d_n = get_unique_list("DomainName")

            finaldata = []
            for row in fetchdata:
                fd = list(row)

                # Defensive: skip if row has too few columns
                if len(fd) < 12:
                    continue

                # Remove first column (original ProcessName, redundant if needed)
                fd.pop(0)

                # If NewProcessName is at index 0 now and shouldn't be included, remove (based on original logic)
                if len(fd) == 14:
                    fd.pop()

                # Safely insert Duration between EndTime and Output
                if len(fd) > 10:
                    try:
                        duration = time_difference(fd[9], fd[10])
                    except:
                        duration = "NA"
                else:
                    duration = "NA"

                fd.insert(11, duration)
                finaldata.append(fd)

            # Insert heading for duration
            headings.insert(11, "Duration")

            # Add serial number column to data and headings
            for i, row in enumerate(finaldata, start=1):
                row.insert(0, i)
            headings.insert(0, "S.No")

            group_by_field = "ProcessName" if process_name else "DomainName"
            bd_dic = {}

            for row in finaldata:
                # Skip rows that are too short
                if group_by_field == "ProcessName" and len(row) <= 4:
                    continue
                if group_by_field == "DomainName" and len(row) <= 14:
                    continue

                key = row[4] if group_by_field == "ProcessName" else row[14]
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
            # bardata1 = [[vals[i] for vals in bd_dic.values()] for i in range(3)]
            bardata11 = {
                "labels": l2,
                "volumes": [[vals[i] for vals in bd_dic.values()] for i in range(3)]
            }

            dtm = {"01": "January", "02": "February", "03": "March", "04": "April", "05": "May", "06": "June",
                "07": "July", "08": "August", "09": "September", "10": "October", "11": "November", "12": "December"}
            # ld_dic = {}
            # for i, key in enumerate(l2):
            #     month = dtm.get(key[3:5])
            #     if not month:
            #         continue
            #     if month not in ld_dic:
            #         ld_dic[month] = [bardata1[0][i], bardata1[1][i], bardata1[2][i]]
            #     else:
            #         ld_dic[month][0] += bardata1[0][i]
            #         ld_dic[month][1] += bardata1[1][i]
            #         ld_dic[month][2] += bardata1[2][i]

            # l3 = list(ld_dic.keys())
            # bardata2 = [[vals[i] for vals in ld_dic.values()] for i in range(3)]

            ld_dic = {}
            for label, vals in zip(l2, volumes_list):
                if len(label) >= 5:
                    month_code = label[3:5]
                    month = dtm.get(month_code)
                    if not month:
                        continue
                    if month not in ld_dic:
                        ld_dic[month] = vals.copy()
                    else:
                        for i in range(3):
                            try:
                                ld_dic[month][i] += vals[i]
                            except:
                                ld_dic[month][i] = vals[i]

            l3 = list(ld_dic.keys())
            monthly_volumes = list(ld_dic.values())
            bardata22 = {
                'labels': l3,
                'data': [[vals[i] for vals in monthly_volumes] for i in range(3)]
            }

            cache.delete('finaldata_key')
            cache.set('finaldata_key', finaldata)

            return jsonify({
                # 'l2': l2,
                'bardata11': bardata11,
                # 'l3': l3,
                'bardata22': bardata22,
                'data': finaldata,
                'p_n': p_n,
                'u_n': u_n,
                'd_n': d_n,
                'headings': headings,
                'SuccessCount': SuccessCount,
                'FailedCount': FailedCount,
            })




    finally:
        if cur:
            cur.close()
        if connection:
            connection.close()






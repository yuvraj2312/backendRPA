pn = request.form.get('Process_name', "")
        un = request.form.get('User_name', "")
        sn = request.form.get('Status_name', "")
        dn = request.form.get('Domain_name', "")
        date1 = request.form.get('date1', "")
        date2 = request.form.get('date2', "")
       
        cur = connection.cursor()

        SuccessCount = 0
        FailedCount = 0
    
        TableName = "[ProcessData].[dbo].[RPA_Prod_TransactionLog]"
        RColumnSelection = "[CTE].ProcessName AS 'Process Name',[Prod_NLT_List].NewProcessName,COALESCE([Prod_NLT_List].SME, 'NA') AS 'Process Owner',[jira_ID] AS 'Jira ID',[CTE].Date,[CTE].ProcessType AS 'Process Type',[CTE].Status,[CTE].VolumeProcessed AS 'Volume Processed',[CTE].SuccessVolume AS 'Success Volume',[CTE].FailedVolume AS 'Failed Volume',[CTE].StartTime AS 'Start Time',[CTE].EndTime AS 'End Time',[CTE].Output AS 'Output'"
        TColumnSelection = TableName + ".ProcessName AS 'Process Name',[Prod_NLT_List].NewProcessName,COALESCE([Prod_NLT_List].SME, 'NA') AS 'Process Owner',[Jira_ID] AS 'Jira ID'," + TableName + ".Date," + TableName + ".ProcessType AS 'Process Type'," + TableName + ".Status," + TableName + ".VolumeProcessed AS 'Volume Processed'," + TableName + ".SuccessVolume AS 'Success Volume'," + TableName + ".FailedVolume AS 'Failed Volume'," + TableName + ".StartTime AS 'Start Time'," + TableName + ".EndTime AS 'End Time'," + TableName + ".Output AS 'Output'"

        # Prepare query parameters
        params = []
        
        # IF Both the Date are not blank
        if date1.strip() and date2.strip():
            query = "SELECT " + TColumnSelection + " FROM " + TableName + " LEFT JOIN [ProcessData].[dbo].[Prod_NLT_List] ON " + TableName + ".[ProcessName] = [ProcessData].[dbo].[Prod_NLT_List].[ProcessName] WHERE TRY_CONVERT(DATE, Date, 105) >= ? AND TRY_CONVERT(DATE, Date, 105) <= ? AND [ProcessType] LIKE '%Transactional%' AND [Status] LIKE ? AND [Status] NOT LIKE '%Progress%' AND [NLT] LIKE ? AND [DomainName] LIKE ?"
            params.extend([date1, date2, f'%{sn}%', f'%{un}%', f'%{dn}%'])

            if pn:  # Check if pn is not blank
                query += " AND [Prod_NLT_List].[NewProcessName] = ?"
                params.append(pn)

            query += " ORDER BY [EndTime] DESC;"
            cur.execute(query, params)
            fetchdata = cur.fetchall()
 

            query = "WITH CTE AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY Date, ProcessName ORDER BY StartTime DESC) AS rn FROM " + TableName + " WHERE TRY_CONVERT(DATE, Date, 105) >= ? AND TRY_CONVERT(DATE, Date, 105) <= ? AND [ProcessType] NOT LIKE '%Transactional%') SELECT " + RColumnSelection + " FROM CTE LEFT JOIN [Prod_NLT_List] ON [CTE].ProcessName = [Prod_NLT_List].ProcessName WHERE rn = 1 AND [Status] LIKE ? AND [Status] NOT LIKE '%Progress%' AND [NLT] LIKE ? AND [DomainName] LIKE ?"
            params = [date1, date2, f'%{sn}%', f'%{un}%', f'%{dn}%']
            if pn:  # Check if pn is not blank
                query += " AND [Prod_NLT_List].[NewProcessName] = ?"
                params.append(pn)
            query += " ORDER BY [EndTime] DESC;"

            cur.execute(query, params)
            fetchdata = cur.fetchall() + fetchdata

            for record in fetchdata:
                status = record[6]
                if 'Success' in status:
                    SuccessCount += 1
                elif 'Failure' in status:
                    FailedCount += 1

        elif date1.strip() and not date2.strip():
            query = "SELECT " + TColumnSelection + " FROM " + TableName + " LEFT JOIN [ProcessData].[dbo].[Prod_NLT_List] ON " + TableName + ".[ProcessName] = [ProcessData].[dbo].[Prod_NLT_List].[ProcessName] WHERE TRY_CONVERT(DATE, Date, 105) >= ? AND [ProcessType] LIKE '%Transactional%' AND [Status] LIKE ? AND [Status] NOT LIKE '%Progress%' AND [NLT] LIKE ? AND [DomainName] LIKE ?"
            params.extend([date1, f'%{sn}%', f'%{un}%', f'%{dn}%'])

            if pn:  # Check if pn is not blank
                query += " AND [Prod_NLT_List].[NewProcessName] = ?"
                params.append(pn)

            query += " ORDER BY [EndTime] DESC;"
            cur.execute(query, params)
            fetchdata = cur.fetchall()
 

            query = "WITH CTE AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY Date, ProcessName ORDER BY StartTime DESC) AS rn FROM " + TableName + " WHERE TRY_CONVERT(DATE, Date, 105) >= ? AND [ProcessType] NOT LIKE '%Transactional%') SELECT " + RColumnSelection + " FROM CTE LEFT JOIN [Prod_NLT_List] ON [CTE].ProcessName = [Prod_NLT_List].ProcessName WHERE rn = 1 AND [Status] LIKE ? AND [Status] NOT LIKE '%Progress%' AND [NLT] LIKE ? AND [DomainName] LIKE ?"
            params = [date1, f'%{sn}%', f'%{un}%', f'%{dn}%']
            if pn:  # Check if pn is not blank
                query += " AND [Prod_NLT_List].[NewProcessName] = ?"
                params.append(pn)
            query += " ORDER BY [EndTime] DESC;"

            cur.execute(query, params)
            fetchdata = cur.fetchall() + fetchdata

            for record in fetchdata:
                status = record[6]
                if 'Success' in status:
                    SuccessCount += 1
                elif 'Failure' in status:
                    FailedCount += 1

        elif not date1.strip() and date2.strip():
            query = "SELECT " + TColumnSelection + " FROM " + TableName + " LEFT JOIN [ProcessData].[dbo].[Prod_NLT_List] ON " + TableName + ".[ProcessName] = [ProcessData].[dbo].[Prod_NLT_List].[ProcessName] WHERE TRY_CONVERT(DATE, Date, 105) <= ? AND [ProcessType] LIKE '%Transactional%' AND [Status] LIKE ? AND [Status] NOT LIKE '%Progress%' AND [NLT] LIKE ? AND [DomainName] LIKE ?"
            params.extend([date2, f'%{sn}%', f'%{un}%', f'%{dn}%'])

            if pn:  # Check if pn is not blank
                query += " AND [Prod_NLT_List].[NewProcessName] = ?"
                params.append(pn)

            query += " ORDER BY [EndTime] DESC;"
            cur.execute(query, params)
            fetchdata = cur.fetchall()
 

            query = "WITH CTE AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY Date, ProcessName ORDER BY StartTime DESC) AS rn FROM " + TableName + " WHERE TRY_CONVERT(DATE, Date, 105) <= ? AND [ProcessType] NOT LIKE '%Transactional%') SELECT " + RColumnSelection + " FROM CTE LEFT JOIN [Prod_NLT_List] ON [CTE].ProcessName = [Prod_NLT_List].ProcessName WHERE rn = 1 AND [Status] LIKE ? AND [Status] NOT LIKE '%Progress%' AND [NLT] LIKE ? AND [DomainName] LIKE ?"
            params = [date2, f'%{sn}%', f'%{un}%', f'%{dn}%']
            if pn:  # Check if pn is not blank
                query += " AND [Prod_NLT_List].[NewProcessName] = ?"
                params.append(pn)
            query += " ORDER BY [EndTime] DESC;"

            cur.execute(query, params)
            fetchdata = cur.fetchall() + fetchdata

            for record in fetchdata:
                status = record[6]
                if 'Success' in status:
                    SuccessCount += 1
                elif 'Failure' in status:
                    FailedCount += 1

        else:
            query = "SELECT " + TColumnSelection + " FROM " + TableName + " LEFT JOIN [ProcessData].[dbo].[Prod_NLT_List] ON " + TableName + ".[ProcessName] = [ProcessData].[dbo].[Prod_NLT_List].[ProcessName] WHERE [ProcessType] LIKE '%Transactional%' AND [Status] LIKE ? AND [Status] NOT LIKE '%Progress%' AND [NLT] LIKE ? AND [DomainName] LIKE ?"
            params.extend([f'%{sn}%', f'%{un}%', f'%{dn}%'])

            if pn:  # Check if pn is not blank
                query += " AND [Prod_NLT_List].[NewProcessName] = ?"
                params.append(pn)

            query += " ORDER BY [EndTime] DESC;"
            cur.execute(query, params)
            fetchdata = cur.fetchall()
 

            query = "WITH CTE AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY Date, ProcessName ORDER BY StartTime DESC) AS rn FROM " + TableName + " WHERE [ProcessType] NOT LIKE '%Transactional%') SELECT " + RColumnSelection + " FROM CTE LEFT JOIN [Prod_NLT_List] ON [CTE].ProcessName = [Prod_NLT_List].ProcessName WHERE rn = 1 AND [Status] LIKE ? AND [Status]NOT LIKE '%Progress%' AND [NLT] LIKE ? AND [DomainName] LIKE ?"
            params = [f'%{sn}%', f'%{un}%', f'%{dn}%']
            if pn:  # Check if pn is not blank
                query += " AND [Prod_NLT_List].[NewProcessName] = ?"
                params.append(pn)
            query += " ORDER BY [EndTime] DESC;"

            cur.execute(query, params)
            fetchdata = cur.fetchall() + fetchdata

            for record in fetchdata:
                status = record[6]
                if 'Success' in status:
                    SuccessCount += 1
                elif 'Failure' in status:
                    FailedCount += 1

        # Execute successful count query
        def time(timestamp):
            try:
               return datetime.strptime(timestamp, '%d-%m-%Y %H:%M:%S')
            except:
               return datetime.min
        fetchdata = sorted(fetchdata, key=lambda fetchdata: time(fetchdata[10]), reverse=True)

        cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='RPA_Dashboard_Table_Header'")
        fetchheading = cur.fetchall()
        
        headings = [i[0] for i in fetchheading]
        
        # Fetch Process Name
        query = "SELECT DISTINCT(NewProcessName) FROM [Prod_NLT_List] WHERE [NLT] LIKE ? AND [DomainName] LIKE ?"
        cur.execute(query, [f'%{un}%', f'%{dn}%'])
        FetchedProcessName = cur.fetchall()
        
        query = "SELECT DISTINCT(NLT) FROM [Prod_NLT_List]"
        cur.execute(query)
        FetechedNLT = cur.fetchall()
        
        #Fetch Domain Name
        query = "SELECT DISTINCT(DomainName) FROM [Prod_NLT_List]"
        cur.execute(query)
        FetechedDomain = cur.fetchall()
        
        p_n = []
        u_n = []
        d_n = []
        d_n1 = {}
        p_n1 = {}
        u_n1 = {}

        for fd in FetechedDomain:
            if fd[0] not in d_n1:
                d_n1[fd[0]] = 1
                d_n.append(fd[0])       
        for fd in FetechedNLT:
             if fd[0] not in u_n1:
                u_n1[fd[0]] = 1
                u_n.append(fd[0])
        for fd in FetchedProcessName:
            if fd[0] not in p_n1:
                p_n1[fd[0]] = 1
                p_n.append(fd[0])
        
        finaldata = []
        for fd in fetchdata:
            fd = list(fd)
            fd.pop(0)
            if len(fd) == 14:
                fd.pop()     
            finaldata.append(fd) 
        
        #adding duration
        for fd in finaldata:
            try:
                fd.insert(11, time_difference(fd[9], fd[10]))
            except:
                fd.insert(11, "NA")
                continue

        headings.insert(11, "Duration")
        
        #removing runid, machine, username
        s_no = 1
        for fd in finaldata:
            fd.insert(0, s_no)
            s_no += 1
 
        headings.insert(0, "S.No")
        
        #data for bar graph
        bd_dic = {}
        for i in finaldata:
            if i[4] == "" or None:
                continue
            if i[4] not in bd_dic:
                if i[7] is None or i[7] == "" or i[8] is None or i[8] == "" or i[9] is None or i[9] == "":
                    continue
                bd_dic[i[4]] = [int(i[7]), int(i[8]), int(i[9])]
            else:
                if i[7] is None or i[7] == "" or i[8] is None or i[8] == "" or i[9] is None or i[9] == "":
                    continue
                bd_dic[i[4]][0] += int(i[7])
                bd_dic[i[4]][1] += int(i[8])
                bd_dic[i[4]][2] += int(i[9])

        l2 = []
        bd = [[], [], []]
        for i in bd_dic.keys():
            l2.insert(0, i)
            bd[0].insert(0, bd_dic[i][0])
            bd[1].insert(0, bd_dic[i][1])        
            bd[2].insert(0, bd_dic[i][2])
        
        #data for line graph
        dtm = {'01': "January", "02": "February", "03": "March", "04": "April", "05": "May", "06": "June", "07": "July", "08": "August", "09": "September", "10": "October", "11": "November", "12": "December"}
        ld_dic = {}
        for i inrange(0, len(l2)):
            m = dtm[l2[i][3:5]] + l2[i][5:]
            if m not in ld_dic:
                ld_dic[m] = [bd[0][i], bd[1][i], bd[2][i]]
            else:
                ld_dic[m][0] += bd[0][i]
                ld_dic[m][1] += bd[1][i]
                ld_dic[m][2] += bd[2][i]
        
        l1 = []
        ld = [[], [], []]
        
        for i in ld_dic.keys():
            l1.append(i)
            ld[0].append(ld_dic[i][0])
            ld[1].append(ld_dic[i][1])
            ld[2].append(ld_dic[i][2])

        cache.delete('finaldata_key')
        cache.set('finaldata_key', finaldata)
        return render_template('ProcessSearch.html', l1=l1, l2=l2, linedata=ld, bardata=bd, headings=headings, u_n=u_n, p_n=p_n, d_n=d_n, SuccessCount=SuccessCount, FailedCount=FailedCount, pn=pn, un=un, dn=dn, sn=sn, date1=date1, date2=date2)
from flask import request, jsonify
from datetime import datetime
import time
from your_db_utils import get_connection  # replace with your db utility
from your_cache import cache  # replace with your caching module

def time_difference(start, end):
    try:
        start_time = datetime.strptime(start, "%d-%m-%Y %H:%M:%S")
        end_time = datetime.strptime(end, "%d-%m-%Y %H:%M:%S")
        return str(end_time - start_time)
    except:
        return "NA"

@app.route('/', methods=['GET'])
def fetch_dashboard_data():
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

    # ========== TRANSACTIONAL QUERY ==========
    transactional_where = "WHERE 1=1"
    params = []

    if process_name:
        transactional_where += f" AND {table}.ProcessName = ?"
        params.append(process_name)
    if status_name:
        transactional_where += f" AND {table}.Status = ?"
        params.append(status_name)
    if start_date:
        transactional_where += f" AND CAST({table}.Date AS DATE) >= CAST(? AS DATE)"
        params.append(start_date)
    if end_date:
        transactional_where += f" AND CAST({table}.Date AS DATE) <= CAST(? AS DATE)"
        params.append(end_date)

    post_join_conditions = ""
    if user_name:
        post_join_conditions += f" AND PNL.NLT = ?"
        params.append(user_name)
    if domain_name:
        post_join_conditions += f" AND PNL.DomainName = ?"
        params.append(domain_name)

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

    cur.execute(transactional_query, tuple(params))
    fetchdata = cur.fetchall()

    # ========== NON-TRANSACTIONAL QUERY ==========
    log_filters = "WHERE 1=1"
    log_params = []

    if process_name:
        log_filters += f" AND {table}.ProcessName = ?"
        log_params.append(process_name)
    if status_name:
        log_filters += f" AND {table}.Status = ?"
        log_params.append(status_name)
    if start_date:
        log_filters += f" AND CAST({table}.Date AS DATE) >= CAST(? AS DATE)"
        log_params.append(start_date)
    if end_date:
        log_filters += f" AND CAST({table}.Date AS DATE) <= CAST(? AS DATE)"
        log_params.append(end_date)

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

    cur.execute(non_transactional_query, tuple(log_params + params[len(log_params):]))
    fetchdata += cur.fetchall()

    # Sort rows by End Time
    def parse_time_safe(t):
        try:
            return datetime.strptime(t, '%d-%m-%Y %H:%M:%S')
        except:
            return datetime.min

    fetchdata.sort(key=lambda row: parse_time_safe(row[11]), reverse=True)

    # SUCCESS/FAIL COUNT
    def get_count(q, p):
        cur.execute(q, p)
        return len(cur.fetchall())

    where_clause = transactional_where
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

    SuccessCount = get_count(TSuccessCount, tuple(params)) + get_count(RSuccessCount, tuple(log_params))
    FailedCount = get_count(TFailedCount, tuple(params)) + get_count(RFailedCount, tuple(log_params))

    # HEADINGS
    cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='RPA_Dashboard_Table_Header'")
    headings = [row[0] for row in cur.fetchall()]
    headings.insert(11, "Duration")
    headings.insert(0, "S.No")

    # FINAL DATA BUILDING
    finaldata = []
    for i, row in enumerate(fetchdata, start=1):
        r = list(row)
        if len(r) >= 12:
            duration = time_difference(r[10], r[11])
        else:
            duration = "NA"
        r.insert(11, duration)
        r.pop(0)  # remove original ProcessName
        r.insert(0, i)  # insert serial number
        finaldata.append(r)

    # DROPDOWN VALUES
    def get_unique_list(column):
        cur.execute(f"SELECT DISTINCT({column}) FROM [ProcessData].[dbo].[Prod_NLT_List]")
        return [row[0] for row in cur.fetchall() if row[0]]

    p_n = get_unique_list("NewProcessName")
    u_n = get_unique_list("NLT")
    d_n = get_unique_list("DomainName")

    # BAR DATA
    # Bar Chart 1 - Group by Process Name
    bd_dic = {}
    for row in finaldata:
        if len(row) < 10:
            continue
        key = row[4]  # Process Name (adjust index if needed)
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

    labels1 = list(bd_dic.keys())
    volumes_list = list(bd_dic.values())
    bardata11 = {
        "labels": labels1,
        "volumes": [[vals[i] for vals in volumes_list] for i in range(3)]
    }

    # Bar Chart 2 - Group by Month extracted from Date
    dtm = {"01": "January", "02": "February", "03": "March", "04": "April", "05": "May", "06": "June",
        "07": "July", "08": "August", "09": "September", "10": "October", "11": "November", "12": "December"}

    ld_dic = {}
    for row in finaldata:
        if len(row) < 6:
            continue
        date_str = row[5]  # Assuming this is the Date (adjust if needed)
        try:
            month_code = date_str[5:7]  # e.g., '2024-03-01'
            month = dtm.get(month_code)
            if not month:
                continue
            vp, sv, fv = int(row[7]), int(row[8]), int(row[9])
            if month not in ld_dic:
                ld_dic[month] = [vp, sv, fv]
            else:
                ld_dic[month][0] += vp
                ld_dic[month][1] += sv
                ld_dic[month][2] += fv
        except:
            continue

    labels2 = list(ld_dic.keys())
    monthly_volumes = list(ld_dic.values())
    bardata22 = {
        'labels': labels2,
        'data': [[vals[i] for vals in monthly_volumes] for i in range(3)]
    }


    # Caching (optional)
    cache.delete('finaldata_key')
    cache.set('finaldata_key', finaldata)

    return jsonify({
        "bardata11": bardata11,
        "bardata22": bardata22,
        "data": finaldata,
        "p_n": p_n,
        "u_n": u_n,
        "d_n": d_n,
        "success": SuccessCount,
        "failed": FailedCount,
        "headings": headings
    })

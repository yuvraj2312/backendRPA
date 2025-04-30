@app.route('/api/process-search', methods=['POST'])
@token_required
def process_search():
    try:
        data = request.json
        pn = data.get('Process_name', "").strip()
        un = data.get('User_name', "").strip()
        sn = data.get('Status_name', "").strip()
        dn = data.get('Domain_name', "").strip()
        date1 = data.get('date1', "").strip()
        date2 = data.get('date2', "").strip()

        connection = get_connection()
        cur = connection.cursor()

        # Fetch data
        fetchdata = fetch_process_data(cur, pn, un, sn, dn, date1, date2)

        # Count Success/Failure
        SuccessCount = sum(1 for x in fetchdata if 'Success' in x[6])
        FailedCount = sum(1 for x in fetchdata if 'Failure' in x[6])

        fetchdata = sorted(fetchdata, key=lambda x: parse_time(x[10]), reverse=True)
        headings = fetch_headings(cur)
        p_n, u_n, d_n = fetch_dropdown_options(cur, un, dn)
        finaldata, headings = process_final_data(fetchdata, headings)
        l1, l2, ld, bd = prepare_graph_data(finaldata)

        return jsonify({
            "headings": headings,
            "finaldata": finaldata,
            "SuccessCount": SuccessCount,
            "FailedCount": FailedCount,
            "dropdowns": {
                "process_names": p_n,
                "users": u_n,
                "domains": d_n
            },
            "graphs": {
                "line": {"labels": l1, "datasets": ld},
                "bar": {"labels": l2, "datasets": bd}
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if connection: connection.close()


def fetch_process_data(cur, pn, un, sn, dn, date1, date2):
    # Build and execute queries based on date filters
    # Return combined fetchdata
    # Implement your logic here
    pass

def parse_time(timestamp):
    try:
        return datetime.strptime(timestamp, '%d-%m-%Y %H:%M:%S')
    except:
        return datetime.min

def fetch_headings(cur):
    cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='RPA_Dashboard_Table_Header'")
    return [i[0] for i in cur.fetchall()]

def fetch_dropdown_options(cur, un, dn):
    # Fetch Process Names
    cur.execute("SELECT DISTINCT(NewProcessName) FROM [Prod_NLT_List] WHERE [NLT] LIKE ? AND [DomainName] LIKE ?", (f'%{un}%', f'%{dn}%'))
    p_n = [row[0] for row in cur.fetchall()]

    # Fetch NLTs
    cur.execute("SELECT DISTINCT(NLT) FROM [Prod_NLT_List]")
    u_n = [row[0] for row in cur.fetchall()]

    # Fetch Domain Names
    cur.execute("SELECT DISTINCT(DomainName) FROM [Prod_NLT_List]")
    d_n = [row[0] for row in cur.fetchall()]

    return p_n, u_n, d_n

def process_final_data(fetchdata, headings):
    finaldata = []
    for idx, fd in enumerate(fetchdata, start=1):
        fd = list(fd)
        fd.pop(0)  # Remove first element
        if len(fd) == 14:
            fd.pop()  # Remove last element if length is 14
        duration = time_difference(fd[9], fd[10]) if fd[9] and fd[10] else "NA"
        fd.insert(11, duration)
        fd.insert(0, idx)  # Add serial number
        finaldata.append(fd)

    headings.insert(11, "Duration")
    headings.insert(0, "S.No")
    return finaldata, headings

def prepare_graph_data(finaldata):
    bd_dic = {}
    for i in finaldata:
        date_key = i[4]
        if not date_key:
            continue
        volumes = i[7:10]
        if any(v is None or v == "" for v in volumes):
            continue
        volumes = list(map(int, volumes))
        if date_key not in bd_dic:
            bd_dic[date_key] = volumes
        else:
            bd_dic[date_key] = [sum(x) for x in zip(bd_dic[date_key], volumes)]

    l2 = list(bd_dic.keys())
    bd = [list(x) for x in zip(*bd_dic.values())]

    # Prepare line graph data
    dtm = {'01': "January", "02": "February", "03": "March", "04": "April",
           "05": "May", "06": "June", "07": "July", "08": "August",
           "09": "September", "10": "October", "11": "November", "12": "December"}
    ld_dic = {}
    for date_str in l2:
        month = dtm.get(date_str[3:5], "") + date_str[5:]
        if month not in ld_dic:
            ld_dic[month] = bd_dic[date_str]
        else:
            ld_dic[month] = [sum(x) for x in zip(ld_dic[month], bd_dic[date_str])]

    l1 = list(ld_dic.keys())
    ld = [list(x) for x in zip(*ld_dic.values())]

    return l1, l2, ld, bd

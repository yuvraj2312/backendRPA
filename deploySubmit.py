

def createRPAResponse(fileid, bot_id, precheck_postcheck, node_ip):
    return {
        "workItems": [
            {
                "json": {
                    "Node_IP": node_ip,
                    "Process_Type": precheck_postcheck,
                    "olm_id": session.get("olm_id", "dummy_olm"),  # fallback for testing
                    "email_id": session.get("email_id", "dummy@example.com")
                }
            }
        ]
    }

@app.route('/Deploysubmit', methods=['POST'])

def Deploysubmit():
    server = 'ABC'
    database = 'PD'
    username = 'SA'
    password = '123'
    connection_string = (
        'DRIVER={ODBC Driver 17 for SQL Server};'
        f'SERVER={server};DATABASE={database};UID={username};PWD={password}'
    )

    try:
        connection = pyodbc.connect(connection_string)
        cur = connection.cursor()

        
        precheck_postcheck = request.form.get('precheck_postcheck')
        node_ip = request.form.get('node_ip')

        if not precheck_postcheck or not node_ip:
            return jsonify({"error": "Missing required fields"}), 400

        # Generate auth and call external RPA API
        authkey = str(createAuthKey())
        headers = {'Content-Type': 'application/json', "X-Authorization": authkey}
        rparesponse = createRPAResponse(fileid=252923, bot_id=14,
                                        precheck_postcheck=precheck_postcheck,
                                        node_ip=node_ip)

        rpa_api_response = requests.post("https://abcd", json=rparesponse,  verify=False)
        print("External API Response:", rpa_api_response.text)

        # Insert into database
        insert_query = """INSERT INTO dbo.TrafficDashboard (nodeip, checktype) VALUES (?, ?)"""
        cur.execute(insert_query, (node_ip, precheck_postcheck))
        connection.commit()

        return jsonify({"message": "Submitted successfully"}), 200

    except Exception as e:
        print("Error occurred:", traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500

    finally:
        try:
            cur.close()
            connection.close()
        except:
            pass

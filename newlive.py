@app.route('/processlist', methods=['GET'])
# @token_required
def processlist():
    connection = None
    cur = None
    try:
        # Establish a connection
        connection = get_connection()
        cur = connection.cursor()

        # Get query parameters from the URL
        domain = request.args.get('domain', default=None, type=str)
        start_date = request.args.get('startDate', default=None, type=str)
        end_date = request.args.get('endDate', default=None, type=str)

        # Base query
        query = """
            SELECT NewProcessName, NLT, DomainName, SME, AutomationStage, GoLiveDate
            FROM LiveProcess
        """
        filters = []
        values = []

        # Apply filters only if provided
        if domain:
            filters.append("DomainName = ?")
            values.append(domain)
        if start_date and end_date:
            filters.append("""
                TRY_CONVERT(DATE, GoLiveDate, 3) 
                BETWEEN TRY_CONVERT(DATE, ?, 3) AND TRY_CONVERT(DATE, ?, 3)
            """)
            values.append(start_date)
            values.append(end_date)

        # Add WHERE clause if filters exist
        if filters:
            query += " WHERE " + " AND ".join(filters)

        query += " ORDER BY TRY_CONVERT(DATE, GoLiveDate, 3) DESC;"

        # Execute the query
        cur.execute(query, tuple(values))
        rows = cur.fetchall()

        # Format response as list of dictionaries
        data = []
        for row in rows:
            data.append({
                "process": row[0],
                "nlt": row[1],
                "domain": row[2],
                "owner": row[3],
                "stage": row[4],
                "goLive": row[5],
            })

        return jsonify(data)

    finally:
        if cur:
            cur.close()
        if connection:
            connection.close()


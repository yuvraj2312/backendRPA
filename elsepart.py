from flask import request, jsonify
from datetime import datetime
import pyodbc  # assuming you're using pyodbc for SQL Server

@app.route("/ProcessSearch", methods=["GET"])
def search_process_data():
    try:
        cursor = conn.cursor()

        # Get filters from request
        process_name = request.args.get("process_name", "")
        user_name = request.args.get("nlt_name", "")
        status_name = request.args.get("status", "")
        domain_name = request.args.get("domain_name", "")
        start_date = request.args.get("start_date", "")
        end_date = request.args.get("end_date", "")

        # Base where clause and parameters list
        where_clauses = []
        params = []

        if process_name:
            where_clauses.append("t.ProcessName = ?")
            params.append(process_name)

        if user_name:
            where_clauses.append("t.NLT_User = ?")
            params.append(user_name)

        if status_name:
            where_clauses.append("t.Status = ?")
            params.append(status_name)

        if domain_name:
            where_clauses.append("p.DomainName = ?")
            params.append(domain_name)

        if start_date:
            where_clauses.append("t.StartTime >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("t.StartTime <= ?")
            params.append(end_date)

        # Final WHERE clause
        where_sql = " AND ".join(where_clauses)
        if where_sql:
            where_sql = "WHERE " + where_sql

        # Query 1: Daily volume for current month
        bar_query_1 = f"""
            SELECT FORMAT(t.StartTime, 'yyyy-MM-dd') as Date, COUNT(*) as Volume
            FROM RPA_Prod_TransactionLog t
            INNER JOIN Prod_NLT_List p ON t.ProcessName = p.ProcessName
            {where_sql}
            GROUP BY FORMAT(t.StartTime, 'yyyy-MM-dd')
            ORDER BY Date
        """
        cursor.execute(bar_query_1, params)
        daily_data = cursor.fetchall()
        bardata1 = {
            "labels": [row.Date for row in daily_data],
            "volumes": [row.Volume for row in daily_data]
        }

        # Query 2: Monthly volume for current year
        bar_query_2 = f"""
            SELECT FORMAT(t.StartTime, 'yyyy-MM') as Month, COUNT(*) as Volume
            FROM RPA_Prod_TransactionLog t
            INNER JOIN Prod_NLT_List p ON t.ProcessName = p.ProcessName
            {where_sql}
            GROUP BY FORMAT(t.StartTime, 'yyyy-MM')
            ORDER BY Month
        """
        cursor.execute(bar_query_2, params)
        monthly_data = cursor.fetchall()
        bardata2 = {
            "labels": [row.Month for row in monthly_data],
            "volumes": [row.Volume for row in monthly_data]
        }

        # Query 3: Table data
        table_query = f"""
            SELECT t.ProcessName, t.NLT_User, p.DomainName, t.Status, t.StartTime, t.EndTime
            FROM RPA_Prod_TransactionLog t
            INNER JOIN Prod_NLT_List p ON t.ProcessName = p.ProcessName
            {where_sql}
            ORDER BY t.StartTime DESC
        """
        cursor.execute(table_query, params)
        table_rows = cursor.fetchall()
        table_data = [
            {
                "ProcessName": row.ProcessName,
                "NLT_User": row.NLT_User,
                "DomainName": row.DomainName,
                "Status": row.Status,
                "StartTime": row.StartTime.strftime("%Y-%m-%d %H:%M:%S") if row.StartTime else "",
                "EndTime": row.EndTime.strftime("%Y-%m-%d %H:%M:%S") if row.EndTime else "",
            }
            for row in table_rows
        ]

        # Query 4: Count success and failed
        success_query = f"""
            SELECT
                SUM(CASE WHEN t.Status = 'Success' THEN 1 ELSE 0 END) AS SuccessCount,
                SUM(CASE WHEN t.Status = 'Failed' THEN 1 ELSE 0 END) AS FailedCount
            FROM RPA_Prod_TransactionLog t
            INNER JOIN Prod_NLT_List p ON t.ProcessName = p.ProcessName
            {where_sql}
        """
        cursor.execute(success_query, params)
        result = cursor.fetchone()
        success_count = result.SuccessCount or 0
        failed_count = result.FailedCount or 0

        return jsonify({
            "bardata1": bardata1,
            "bardata2": bardata2,
            "table_data": table_data,
            "success_count": success_count,
            "failed_count": failed_count,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

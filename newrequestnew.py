from flask import Flask, request, jsonify, render_template_string, redirect, url_for
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import sqlite3

app = Flask(__name__)

# Database connection helper
def get_connection():
    connection = sqlite3.connect('your_database.db')  # Update with your DB file
    connection.row_factory = sqlite3.Row
    return connection

@app.route('/usecase', methods=['POST'])
def usecase():
    connection = None
    cur = None
    try:
        connection = get_connection()
        cur = connection.cursor()

        form_data = request.json  # Expecting JSON data

        # Format current date and ID
        current_datetime = datetime.now()
        date_str = current_datetime.strftime('%d-%b-%y %H:%M:%S')
        id_str = current_datetime.strftime('%d%m%y%H%M%S')  # Ensure this format is valid for your ID

        # Insert into database
        query = '''
        INSERT INTO Usecase (
            Date, ID, OLM_ID, Priority, Use_Case_Name, Use_Case_Description, 
            Volume_Unit, Volume, Activity_Frequency, Circle_Number, Circle_Name, 
            Time_Required, SLA_Expected, No_of_Assistant_Manager, No_of_Deputy_Manager, 
            No_of_Manager, No_of_Senior, OEM_Domain, Systems_Tools, Activity_Performed_By, 
            Partner_Name, KPI_Indicators
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        params = (
            date_str, id_str, form_data['olmId'], form_data['priority'],
            form_data['useCase'], form_data['useCaseDescription'],
            form_data['volumeUnit'], form_data['volume'],
            form_data['activityFrequency'], form_data['circleNumber'],
            form_data['circleName'], form_data['timeRequired'],
            form_data['slaExpected'], form_data['am'],
            form_data['deputyM'], form_data['manager'],
            form_data['senior'], form_data['oemDomain'],
            form_data['systemsTools'], form_data['activityPerformedBy'],
            form_data['partnerName'], form_data['kpiIndicators']
        )
        cur.execute(query, params)
        connection.commit()

        # Email body creation using render_template_string
        email_body = render_template_string('''
        <style>
        .Font {
            font-family: "Calibri", sans-serif;
        }
        table, th, td {
            border: 1px solid black;
            border-collapse: collapse;
            padding: 6px;
            text-align: left;
        }
        </style>
        <body>
        <p class="Font">Hi All,<br><br>
        Please find the new automation usecase details below<br>
        <table>
            <tbody>
                {% for key, value in form_data.items() %}
                    <tr>
                        <td bgcolor="#CCCCFF"><b>{{ key.replace('_', ' ') }}</b></td>
                        <td>{{ value }}</td>
                    </tr>
                {% endfor %}
            </tbody>
        </table>
        <br>Thanks & Regards,<br><b>Digitization-RPA</b><br>
        <br>**Kindly note, this email is system generated. Please do not reply.**
        </p>
        </body>
        ''', form_data=form_data)

        # SMTP server details
        smtp_server = '11.11.111.1'  # Replace with actual SMTP server
        smtp_port = 11  # Replace with actual port
        smtp_user = None  # If authentication is required, set username
        smtp_password = None  # If authentication is required, set password

        from_email = 'RPABot@yuvi.com'  # Replace with actual sender email
        to_email = 'a_divay.kumar@airtel.com'  # Replace with actual recipient email
        cc_emails = ['a_divay.kumar@airtel.com', 'olm_email']  # Add other CC email addresses
        subject = f'New Use case - Tracking ID: {id_str}'

        # Create the email
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Cc'] = ', '.join(cc_emails)
        msg['Subject'] = subject
        msg.attach(MIMEText(email_body, 'html'))

        # Send the email
        try:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)  # Login if credentials are provided
                server.send_message(msg)  # Send email
            return redirect(url_for('Usecase') + '?success=true&tracking_id=' + id_str)
        except Exception as e:
            return f'Failed to send email. Error: {e}', 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if connection:
            connection.close()

if __name__ == '__main__':
    app.run(debug=True)

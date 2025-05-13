from flask import Flask, request, render_template, redirect, url_for, render_template_string
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re

app = Flask(__name__)

# Dummy function to get database connection
def get_connection():
    import sqlite3
    return sqlite3.connect('database.db')

@app.route('/Usecase', methods=['GET', 'POST'])
# @token_required
def Usecase():
    connection = None
    cur = None

    try:
        connection = get_connection()

        if request.method == 'POST':
            cur = connection.cursor()

            # Get form data
            form_data = {
                'OLM_ID': request.form.get('OLM_ID', '').strip(),
                'Priority': request.form.get('Priority', '').strip(),
                'Use_Case_Name': request.form.get('Use_Case_Name', '').strip(),
                'Use_Case_Description': request.form.get('Use_Case_Description', '').strip(),
                'Volume_Unit': request.form.get('Volume_Unit', '').strip(),
                'Volume': request.form.get('Volume', '').strip(),
                'Activity_Frequency': request.form.get('Activity_Frequency', '').strip(),
                'Circle_Number': request.form.get('Circle_Number', '').strip(),
                'Circle_Name': request.form.get('Circle_Name', '').strip(),
                'Time_Required': request.form.get('Time_Required', '').strip(),
                'SLA_Expected': request.form.get('SLA_Expected', '').strip(),
                'No_of_Assistant_Manager': request.form.get('No_of_Assistant_Manager', '').strip(),
                'No_of_Deputy_Manager': request.form.get('No_of_Deputy_Manager', '').strip(),
                'No_of_Manager': request.form.get('No_of_Manager', '').strip(),
                'No_of_Senior': request.form.get('No_of_Senior', '').strip(),
                'OEM_Domain': request.form.get('OEM_Domain', '').strip(),
                'Application_Used': request.form.get('Application_Used', '').strip(),
                'Activity_Performed_By': request.form.get('Activity_Performed_By', '').strip(),
                'Partner_Name': request.form.get('Partner_Name', '').strip(),
                'KPI_Indicators': request.form.get('KPI_Indicators', '').strip()
            }

            # Validate required fields
            required_fields = [
                'OLM_ID', 'Priority', 'Use_Case_Name', 'Use_Case_Description',
                'Volume_Unit', 'Volume', 'Activity_Frequency',
                'Time_Required', 'SLA_Expected',
                'OEM_Domain', 'Application_Used', 'Activity_Performed_By', 'KPI_Indicators'
            ]
            for field in required_fields:
                if not form_data.get(field):
                    return f'Missing required field: {field}', 400

            # Validate email format based on OLM_ID
            olm_id = form_data['OLM_ID']
            olm_email = f"{olm_id}@yuvi.com"
            if not re.match(r"[^@]+@[^@]+\.[^@]+", olm_email):
                return 'Invalid OLM email address.', 400

            # Format current date and ID
            current_datetime = datetime.now()
            date_str = current_datetime.strftime('%d-%b-%y %H:%M:%S')
            id_str = current_datetime.strftime('%d%m%y%H%M%S')

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
                date_str, id_str, form_data['OLM_ID'], form_data['Priority'],
                form_data['Use_Case_Name'], form_data['Use_Case_Description'],
                form_data['Volume_Unit'], form_data['Volume'],
                form_data['Activity_Frequency'], form_data['Circle_Number'],
                form_data['Circle_Name'], form_data['Time_Required'],
                form_data['SLA_Expected'], form_data['No_of_Assistant_Manager'],
                form_data['No_of_Deputy_Manager'], form_data['No_of_Manager'],
                form_data['No_of_Senior'], form_data['OEM_Domain'],
                form_data['Application_Used'], form_data['Activity_Performed_By'],
                form_data['Partner_Name'], form_data['KPI_Indicators']
            )

            cur.execute(query, params)
            connection.commit()

            # Create HTML table for email body
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
            smtp_server = '11.11.111.1'
            smtp_port = 11
            smtp_user = None
            smtp_password = None

            from_email = 'RPABot@yuvi.com'
            to_email = 'a_divay.kumar@airtel.com'
            cc_emails = ['a_divay.kumar@airtel.com', olm_email]
            subject = f'New Use case - Tracking ID: {id_str}'

            # Create email
            msg = MIMEMultipart()
            msg['From'] = from_email
            msg['To'] = to_email
            msg['Cc'] = ', '.join(cc_emails)
            msg['Subject'] = subject
            msg.attach(MIMEText(email_body, 'html'))

            # Send the email
            try:
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    server.send_message(msg)
                return redirect(url_for('Usecase') + '?success=true&tracking_id=' + id_str)
            except Exception as e:
                return f'Failed to send email. Error: {e}', 500

        return render_template('Usecase.html')

    finally:
        if cur:
            cur.close()
        if connection:
            connection.close()

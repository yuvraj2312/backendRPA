import os
import csv

# Define the path to our files
data_folder = r'\\111'

# Region name to code mapping
regions = {
    'Mumbai': 'MUM', 'Chennai': 'CHN', 'Rajasthan': 'RJ', 'AP': 'AP',
    'UPE': 'UPE', 'Karanataka': 'KK', 'MAH': 'MH', 'HP': 'HP',
    'MP': 'MP', 'Assam': 'AS', 'WB': 'WB', 'Kerala': 'KL',
    'Kolkata': 'KOL', 'Odisha': 'OD', 'Bihar': 'BH', 'JK': 'JK',
    'Delhi': 'DEL', 'TN': 'TN', 'Haryana': 'HR', 'North-East': 'NE',
    'UPW': 'UPW', 'Punjab': 'PB', 'Gujarat': 'GJ'
}

# Process each file in the directory
for filename in os.listdir(data_folder):
    # Check for VoLTE files with +0530 suffix
    if filename.startswith('VoLTEVoWiFiStatsByCircleRat-Calculated') and '+0530' in filename:
        file_path = os.path.join(data_folder, filename)

        # Open and read the CSV file to get the region from A2 cell
        with open(file_path, 'r', encoding='utf-8-sig') as csvfile:
            csv_reader = csv.reader(csvfile)
            next(csv_reader, None)  # Skip header row
            data_row = next(csv_reader, None)  # Get second row
            if data_row:
                region = data_row[0].strip()
                if region in regions:
                    region_code = regions[region]
                    new_filename = f"{region_code}+0530.csv"
                    new_filepath = os.path.join(data_folder, new_filename)

                    # Rename the file
                    os.rename(file_path, new_filepath)
                else:
                    print(f"Unknown region '{region}' in file {filename}")
            else:
                print(f"Missing data in file {filename}")

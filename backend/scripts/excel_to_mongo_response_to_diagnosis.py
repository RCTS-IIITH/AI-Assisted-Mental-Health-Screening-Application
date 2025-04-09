import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# MongoDB credentials
mongo_uri = os.getenv("MONGO_URI")

# Connect to MongoDB
client = MongoClient(mongo_uri)
db = client["result_to_diagnosis"]  # Replace 'test' with the name of the database

# Load Excel file
source_file = "file.xlsx"  # Replace with the path to Excel file

# Load the Excel file
xl = pd.ExcelFile(source_file)

for req_sheet_name in xl.sheet_names:
    print(f"Processing sheet '{req_sheet_name}'")

    # Read the sheet into a DataFrame
    sheet = xl.parse(req_sheet_name, header=None)

    # Process the sheet and set the header row
    for i, row in sheet.iterrows():
        if "REPORT TO BE SENT" in row.values:
            sheet.columns = row.str.strip()  # Set this row as the header
            sheet = sheet[i + 1 :]  # Remove the header row from the data
            break

    # Drop empty columns
    sheet.dropna(axis=1, how="all", inplace=True)
    sheet = sheet.loc[:, sheet.columns.notna()]

    # Reset index
    sheet.reset_index(drop=True, inplace=True)

    # print(sheet.head())

    # Limit rows
    max_rows = 5
    if max_rows is not None:
        sheet = sheet.head(max_rows)

    # Convert the DataFrame to a list of dictionaries (one for each row)
    data = sheet.to_dict(orient="records")

    # Insert the data into MongoDB collection (one collection per sheet)
    collection = db[req_sheet_name]  # Create collection with the sheet name
    collection.insert_many(data)  # Insert rows as documents

    print(f"Inserted data from sheet '{req_sheet_name}' into MongoDB collection")

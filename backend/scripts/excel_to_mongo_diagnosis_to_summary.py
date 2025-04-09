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
db = client["diagnosis_to_summary"]  # Replace 'test' with the name of the database

# Load Excel file
source_file = "summary.xlsx"  # Replace with the path to Excel file

# Load the Excel file
xl = pd.ExcelFile(source_file)

for req_sheet_name in xl.sheet_names:
    print(f"Processing sheet '{req_sheet_name}'")

    # Read the sheet into a DataFrame
    sheet = xl.parse(req_sheet_name, header=None)    

    # Drop empty columns
    sheet = sheet.drop(sheet.columns[0], axis=1)  # Drop the first column
    sheet = sheet.drop(1, axis=0)  # Drop the second row (index 1)
    
    # New column names
    new_columns = sheet.iloc[0]
    sheet.columns = new_columns
    sheet = sheet.drop(0, axis=0)

    # Strip extra whitespace from column names
    sheet.columns = sheet.columns.str.strip()

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

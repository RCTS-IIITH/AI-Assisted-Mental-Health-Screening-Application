import React, { useState } from "react";
import "./FileUpload.css";
import Navbar from "./Navbar";

function FileUpload() {
    const [file, setFile] = useState(null); // State to store the selected file
    const [fileType, setFileType] = useState(""); // State to store the selected file type
    const [error, setError] = useState(null); // State for errors

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        // setFileType(e.target.files[0].type);
        setError(null); // Clear errors when a new file is selected
    };

    const handleFileTypeChange = (e) => {
        setFileType(e.target.value);
        setError(null); // Clear errors when a new type is selected
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError("Please select a file.");
            return;
        }

        if (!fileType) {
            setError("Please select the file type.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileType", fileType);

        try {
            const response = await fetch("http://127.0.0.1:5000/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert("File uploaded successfully!");
            } else {
                setError(data.error || "File upload failed. Please try again.");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="file-upload-container">
            <Navbar />
            <div className="file-upload-block">
                <h1 className="heading">Upload Your File</h1>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="file"
                        accept=".csv,.txt,.xlsx"
                        onChange={handleFileChange}
                        className="file-input"
                    />
                    <div className="checkbox-group">
                        <label>
                            <input
                                type="radio"
                                name="fileType"
                                value="Response to Diagnosis"
                                onChange={handleFileTypeChange}
                                checked={fileType === "Response to Diagnosis"}
                            />
                            Response to Diagnosis
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="fileType"
                                value="Diagnosis Summary"
                                onChange={handleFileTypeChange}
                                checked={fileType === "Diagnosis Summary"}
                            />
                            Diagnosis Summary
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="fileType"
                                value="Questions"
                                onChange={handleFileTypeChange}
                                checked={fileType === "Questions"}
                            />
                            Questions
                        </label>
                    </div>
                    <button type="submit" className="submit-button">
                        Upload File
                    </button>
                </form>
            </div>
        </div>
    );
}

export default FileUpload;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";  // Import useNavigate
import AnalysisTable from "./AnalysisTable";
import MonthlyAnalysis from "./MonthlyAnalysis";
import './ResponseTable.css';
import Navbar from "./Navbar";

function ResponseTable() {
  // State for selected school
  const [selectedSchool, setSelectedSchool] = useState("All Schools");

  // State for school options
  const [schools, setSchools] = useState(["All Schools"]);

  // State to store fetched candidates
  const [candidates, setCandidates] = useState([]);

  // Initialize the useNavigate hook
  const navigate = useNavigate();

  // Function to fetch schools dynamically from backend 
  const fetchSchools = async () => {
    try {
      console.log("Fetching school names...");
      const response = await fetch("http://127.0.0.1:5000/get_unique_schools", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.schools) {
        setSchools(["All Schools", ...data.schools]);
        console.log("Fetched schools:", data.schools);
      } else if (data.error) {
        console.error("Error fetching schools:", data.error);
      } else {
        console.error("Unexpected response:", data);
      }

    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  // Function to fetch candidates based on selected school
  const fetchCandidates = async (school) => {
    try {
      console.log("Fetching candidates for school:", school);
      const response = await fetch(`http://127.0.0.1:5000/populate_psychologist_table?school_name=${encodeURIComponent(school)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("Fetched candidates:", data);
      setCandidates(data.candidates || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  // useEffect to fetch school names once on component mount
  useEffect(() => {
    fetchSchools();
  }, []);

  // useEffect to fetch candidates whenever selectedSchool changes
  useEffect(() => {
    fetchCandidates(selectedSchool);
  }, [selectedSchool]);

  return (
    <div>
      <Navbar />
      <div className="resp-container">
        <h1 className="title">Responses</h1>

        <div className="dropdown-container">
          <label htmlFor="school-select" className="dropdown-label">
            Select School:
          </label>
          <select
            id="school-select"
            className="dropdown"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
          >
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>

        <div className="resp-table-content">
          <div className="table-container">
            <AnalysisTable candidates={candidates} />
          </div>
          {/* <div className="chart-container">
            <MonthlyAnalysis />
          </div> */}
        </div>
        <div className="back-button-container">
          <button className="back-button" onClick={() => navigate(-1)}>BACK</button> {/* Navigate back */}
        </div>
      </div>
    </div>
  );
}

export default ResponseTable;

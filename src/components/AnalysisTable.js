import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ResponseTable.css"; // Shared CSS file

const AnalysisTable = ({ candidates }) => {
  const navigate = useNavigate();
  const [candidateData, setCandidateData] = useState([]);

  const get_child_data_from_id = async (id) => {
    try {
      console.log("fetching child details for:", id);

      const response = await fetch(`http://127.0.0.1:5000/get_child_data_from_id?child_id=${encodeURIComponent(id)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("fetched child:", data);
      return data;

    } catch (error) {
      console.error("Error fetching child:", error);
    }
  };

  const get_user_data_from_id = async (id) => {
    try {
      console.log("fetching user details for:", id);

      const response = await fetch(`http://127.0.0.1:5000/get_user_data_from_id?user_id=${encodeURIComponent(id)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("fetched user:", data);
      return data;

    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const dataPromises = candidates.map(async (candidate) => {
        const childData = await get_child_data_from_id(candidate.child_id);
        const parentData = await get_user_data_from_id(childData.ParentId);
        // console.log("ret", candidate.diagnosis);
        return {
          child_id: candidate.child_id,
          r_id: candidate.r_id,
          name: childData.Name,
          age: childData.Age,
          parent_name: parentData.name,
          diagnosis: candidate.diagnosis,
        };
      });

      const resolvedData = await Promise.all(dataPromises);
      console.log(resolvedData);
      setCandidateData(resolvedData);
    };

    fetchData();
  }, [candidates]);

  const handleRowClick = (candidate) => {
    // Navigate and pass resolved data for the selected candidate
    navigate(`/view-response/${candidate.r_id}`, { state: { candidate } });
  };

  return (
    <div className="analysis-table">
      <table>
        <thead>
          <tr>
            <th>Child Name</th>
            <th>Parent Name</th>
            <th>Diagnosis</th>
          </tr>
        </thead>
        <tbody>
          {candidateData.length > 0 ? (
            candidateData.map((candidate, index) => (
              <tr
                key={index}
                onClick={() => handleRowClick(candidate)}
                className="clickable-row"
              >
                <td>{candidate.name}</td>
                <td>{candidate.parent_name}</td>
                <td className="view-link">{candidate.diagnosis}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No data available for the selected school.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AnalysisTable;
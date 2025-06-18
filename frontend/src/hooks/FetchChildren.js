import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getServerData } from "../helper/helper";

export const useFetchChildren = (userId, userType, schoolName, triggerFetch) => {
  const [getData, setGetData] = useState({ isLoading: false, apiData: [], serverError: null });

  useEffect(() => {
    if (userId && userType) {
      // Set loading state to true
      setGetData((prev) => ({ ...prev, isLoading: true }));

      // Prepare data to send to the server
      const requestData = {
        user_type: userType.toLowerCase(),
        parent_id: userType !== "teacher" ? userId : undefined,
        schoolName: userType === "teacher" ? schoolName : undefined,
      };

      // Fetch children data when userId and userType are available
      (async () => {
        try {
          let url = `http://127.0.0.1:5000/children?user_type=${encodeURIComponent(requestData.user_type)}`;
          if (requestData.parent_id) {
            url += `&parent_id=${encodeURIComponent(requestData.parent_id)}`;
          }
          if (requestData.schoolName) {
            url += `&school=${encodeURIComponent(requestData.schoolName)}`;
          }

          console.log("Fetching children from URL:", url);

          const childrenData = await getServerData(url);

          // Update state with fetched data
          setGetData((prev) => ({ ...prev, isLoading: false, apiData: childrenData || [] }));
        } catch (error) {
          // Handle errors and update loading state
          console.error("Error fetching children data:", error);
          setGetData((prev) => ({ ...prev, isLoading: false, serverError: error.message }));
        }
      })();
    }
  }, [userId, userType, schoolName, triggerFetch]);

  return [getData, setGetData];
};

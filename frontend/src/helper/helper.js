import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import axios from 'axios';

/** Helper function to count the number of defined answers */
export function attempts_Number(result) {
    return result.filter(r => r !== undefined).length;
}

/** Helper function to calculate earned points based on correct answers */
export function earnPoints_Number(result, answers, point) {
    return result
        .map((element, i) => answers[i] === element)
        .filter(i => i)
        .map(i => point)
        .reduce((prev, curr) => prev + curr, 0);
}

/** Flag the result if the user has earned at least 50% of the total points */
export function flagResult(totalPoints, earnPoints) {
    return (totalPoints * 50 / 100) < earnPoints;  /** earn 50% marks */
}

/** Check if user is authenticated */
export function CheckUserExist({ children }) {
    const auth = useSelector(state => state.result.userId);
    return auth ? children : <Navigate to={'/'} replace={true}></Navigate>;
}

/** Get server data with error handling */
export async function getServerData(url, callback) {
    try {
        const response = await axios.get(url);
        if (response.status !== 200) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data = response.data;
        return callback ? callback(data) : data;
    } catch (error) {
        // Log the error and rethrow it for further handling
        console.error("Error fetching data:", error.message || error);
        throw new Error(error.message || "An error occurred while fetching data");
    }
}

/** Post server data with error handling */
export async function postServerData(url, result, callback) {
    try {
        const response = await axios.post(url, result);
        if (response.status !== 200) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const data = response.data;
        return callback ? callback(data) : data;
    } catch (error) {
        // Log the error and rethrow it for further handling
        console.error("Error posting data:", error.message || error);
        throw new Error(error.message || "An error occurred while posting data");
    }
}

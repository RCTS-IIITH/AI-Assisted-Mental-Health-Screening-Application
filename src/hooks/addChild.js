import { useState } from "react";

export const useAddChild = () => {
    const [isPosting, setIsPosting] = useState(false);
    const [error, setError] = useState(null);

    const addChild = async (name, school, age, parent_id) => {
        setIsPosting(true);
        setError(null); // Reset error state before the request

        try {
            const url = `http://127.0.0.1:5000/children/add`;

            // Log request payload for debugging
            console.log('Making POST request to:', url);
            console.log('Payload:', { name, school, age, parent_id });

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify({ name, school, age, parent_id }),
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json(); // Parse response once

            if (!response.ok) {
                console.error('Error response from server:', data);
                throw new Error(data.message || 'Failed to add child'); // Default error message
            }

            console.log('Server response:', data);
            return data; // Return the added child object
        } catch (err) {
            console.error('Error occurred in addChild:', err.message || 'Unknown error');
            setError(err); // Update error state
            throw err; // Re-throw error to allow the calling component to handle it
        } finally {
            setIsPosting(false); // Ensure `isPosting` is reset
        }
    };

    return { addChild, isPosting, error };
};

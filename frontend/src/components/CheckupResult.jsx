import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const CheckupResult = () => {
  const { requestId } = useParams();
  const { user } = useContext(AuthContext);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // const BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/checkup-results/${requestId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        setResult(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("No results found for this checkup request yet.");
        } else {
          setError("Failed to load checkup results.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchResult();
    } else {
      setError("You must be logged in to view results.");
      setLoading(false);
    }
  }, [requestId, user, import.meta.env.VITE_API_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link to="/patient-dashboard" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Checkup Results</h2>
        <Link to="/patient-dashboard" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-semibold">Checkup Details</h3>
          <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        </div>

        <div className="mb-4">
          <p className="font-medium">Dentist:</p>
          <p>{result.checkupRequest?.dentist?.username || "Unknown Dentist"}</p>
        </div>

        <div className="mb-4">
          <p className="font-medium">Date:</p>
          <p>{new Date(result.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="mb-4">
          <p className="font-medium">Notes from Dentist:</p>
          <div className="bg-gray-50 p-4 rounded border mt-2">
            {result.notes || "No notes provided."}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Dental Images</h3>
        {result.images?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.images.map((imageUrl, index) => (
              <div key={index} className="border rounded overflow-hidden">
                <img
                  src={`${import.meta.env.REACT_APP_API_URL}${imageUrl}`}
                  alt={`Dental checkup image ${index + 1}`}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No images provided.</p>
        )}
      </div>
    </div>
  );
};

export default CheckupResult;

import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dentists, setDentists] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // derive base URL from env var
  // const BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch all dentists
        const dentistsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/dentists`
        );
        setDentists(dentistsRes.data);

        // Fetch patient's requests
        const requestsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/checkup-requests`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setRequests(requestsRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    } else {
      setError("You must be logged in");
      setLoading(false);
    }
  }, [user, import.meta.env.VITE_API_URL]);

  const handleRequestCheckup = async (e) => {
    e.preventDefault();
    if (!selectedDentist) {
      setError("Please select a dentist");
      return;
    }

    setError("");
    setSuccessMessage("");
    setSubmitLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/checkup-requests`,
        { dentistId: selectedDentist },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Refresh the requests list
      const requestsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/checkup-requests`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setRequests(requestsRes.data);
      setSuccessMessage("Checkup request sent successfully!");
      setSelectedDentist("");
    } catch (err) {
      console.error(err);
      setError("Failed to send checkup request");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Patient Dashboard</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Request a Dental Checkup</h3>
        <form onSubmit={handleRequestCheckup}>
          <div className="mb-4">
            <label htmlFor="dentist" className="block text-gray-700 mb-2">
              Select a Dentist
            </label>
            <select
              id="dentist"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={selectedDentist}
              onChange={(e) => setSelectedDentist(e.target.value)}
              required
            >
              <option value="">-- Select a Dentist --</option>
              {dentists.map((dentist) => (
                <option key={dentist._id} value={dentist._id}>
                  {dentist.username}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitLoading}
            className={`py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
              submitLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitLoading ? "Sending Request..." : "Request Checkup"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Your Checkup Requests</h3>
        {requests.length === 0 ? (
          <p className="text-gray-500">You have no checkup requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Dentist</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Date</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td className="py-2 px-4 border-b">
                      {request.dentist?.username || "Unknown"}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {request.status === "completed" ? (
                        <Link
                          to={`/checkup-result/${request._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Results
                        </Link>
                      ) : (
                        <span className="text-gray-400">Awaiting Results</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;

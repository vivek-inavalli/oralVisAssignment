import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const DentistDashboard = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({ notes: "", images: [] });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [completedResult, setCompletedResult] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/dentist/checkup-requests`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setRequests(res.data);
      } catch (err) {
        setError("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchRequests();
    } else {
      setError("You must be logged in as a dentist");
      setLoading(false);
    }
  }, [user]);

  const handleSelectRequest = async (request) => {
    setSelectedRequest(request);
    setFormData({ notes: "", images: [] });
    setError("");
    setSuccessMessage("");
    setCompletedResult(null);

    if (request.status === "completed") {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/checkup-results/${request._id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setCompletedResult(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load completed result.");
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "images") {
      setFormData((f) => ({
        ...f,
        images: Array.from(e.target.files),
      }));
    } else {
      setFormData((f) => ({
        ...f,
        [e.target.name]: e.target.value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setSubmitLoading(true);

    try {
      const fd = new FormData();
      formData.images.forEach((file) => fd.append("images", file));
      fd.append("notes", formData.notes);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/dentist/upload-result/${
          selectedRequest._id
        }`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/dentist/checkup-requests`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setRequests(res.data);
      setSuccessMessage("Results uploaded successfully!");
      setSelectedRequest(null);
    } catch (err) {
      setError("Failed to upload results");
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
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Dentist Dashboard</h2>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Checkup Requests List */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Checkup Requests</h3>
          {requests.length === 0 ? (
            <p className="text-gray-500">No pending requests.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {requests.map((req) => (
                <li
                  key={req._id}
                  className={`py-3 cursor-pointer hover:bg-gray-50 ${
                    selectedRequest?._id === req._id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleSelectRequest(req)}
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {req.patient?.username || "Unknown Patient"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        req.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected Request Details */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
          {selectedRequest ? (
            <>
              <h3 className="text-xl font-semibold mb-4">
                {selectedRequest.patient?.username || "Patient"}'s Checkup
              </h3>

              {selectedRequest.status === "completed" && completedResult ? (
                <div>
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Results already submitted.
                  </div>
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Notes:</h4>
                    <p className="text-gray-700">{completedResult.notes}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Uploaded Images:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {completedResult.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={`${import.meta.env.VITE_API_URL}${img}`}
                          alt={`Dental ${idx + 1}`}
                          className="w-full h-40 object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="notes" className="block text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.notes}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="images"
                      className="block text-gray-700 mb-2"
                    >
                      Dental Images
                    </label>
                    <input
                      type="file"
                      id="images"
                      name="images"
                      multiple
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      onChange={handleChange}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      You can select multiple images.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className={`py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                      submitLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {submitLoading ? "Uploading..." : "Upload Results"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-500">
              <p>Select a request to upload results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DentistDashboard;

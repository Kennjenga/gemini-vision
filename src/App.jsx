import { useState, useEffect } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:8001"; // Match the backend port

  const uploadImage = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("image", selectedFile);

      try {
        // First test if server is reachable
        const healthCheck = await fetch(`${API_URL}/`);
        if (!healthCheck.ok) {
          throw new Error("Server is not responding");
        }

        const response = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData,
          // Add these headers for better error handling
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();
        setImage(selectedFile);
        console.log("Upload successful:", data);
      } catch (error) {
        console.error("Upload error:", error);
        if (error.message === "Failed to fetch") {
          setError(
            "Cannot connect to server. Please ensure the server is running on port 8001"
          );
        } else {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Check server connection on component mount
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Server connection failed");
      })
      .catch((error) => {
        console.error("Server check failed:", error);
        setError(
          "Cannot connect to server. Please ensure the server is running on port 8001"
        );
      });

    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  // logic for analyze image
  const analyzeImage = async () => {
    // Ensure an image is selected
    if (!image) {
      setError("No image selected to analyze");
      return;
    }

    try {
      const options = {
        method: "POST",
        body: JSON.stringify({ message: value }),
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Send POST request to the backend
      const response = await fetch(`${API_URL}/gemini`, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze image");
      }

      // Retrieve the text response
      const text = await response.text();
      setResponse(text);
    } catch (e) {
      console.error("Failed to analyze image:", e);
      setError(e.message || "Error analyzing image");
    }
  };

  const clear = () => {
    setValue("");
    setResponse(null);
    setError(null);
  };

  // logic for the suprise
  const supriseOptions = ["suprise me", "what is in the image"];
  const suprise = () => {
    const randomValue =
      supriseOptions[Math.floor(Math.random() * supriseOptions.length)];
    setValue(randomValue);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-2xl font-bold mb-6">Gemini Vision</div>

      <div className="space-y-4">
        {error && (
          <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-600 p-4 bg-gray-50 rounded-lg">
            Uploading image...
          </div>
        )}

        {image && (
          <div className="flex justify-center">
            <img
              src={URL.createObjectURL(image)}
              alt="Uploaded"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ maxHeight: "100px", objectFit: "contain" }}
            />
          </div>
        )}

        <div className="flex justify-center">
          <label
            htmlFor="files"
            className={`cursor-pointer ${
              loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            } text-white px-4 py-2 rounded-lg transition-colors duration-200`}
          >
            {loading ? "Uploading..." : "Insert Image"}
          </label>
          <input
            onChange={uploadImage}
            id="files"
            accept="image/*"
            type="file"
            className="hidden"
            disabled={loading}
          />
        </div>
        <div>
          What do you want to know about the image?
          <button onClick={suprise}>describe image</button>
        </div>
        <div className="input-container">
          <input
            value={value}
            placeholder="What is in the image..."
            onChange={(e) => setValue(e.target.value)}
          />
          {!response && !error && (
            <button onClick={analyzeImage}>Ask me</button>
          )}
          {(response || error) && <button onClick={clear}>Clear</button>}
          {error && <p>{error}</p>}
          {response && <p>{response}</p>}
        </div>
      </div>
    </div>
  );
}

export default App;

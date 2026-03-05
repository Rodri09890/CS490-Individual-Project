import React, { useState } from "react";

function FilmSearch() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("title");
  const [films, setFilms] = useState([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [customerId, setCustomerId] = useState("");

  const handleSearch = async () => {
    try {
      setSearching(true);
      setFilms([]);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/search?q=${query}&filter=${filter}`
      );

      const data = await response.json();
      setFilms(data);
    } catch (err) {
      console.error("Error searching films:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleRent = async () => {
  if (!customerId) {
    setMessage("Please enter your customer ID.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/rent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        film_id: selectedFilm.film_id,
        customer_id: parseInt(customerId)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not rent film");
    } else {
      setMessage("Film rented successfully!");
    }

  } catch (err) {
    console.error(err);
    setMessage("Server error");
  }
};

  return (
    <div className="films-container">
      <h2 className="films-title">Search Films</h2>

      <div className="films-search-bar">
        <input
          type="text"
          placeholder="Enter keywords..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="films-input"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="films-select"
        >
          <option value="title">Title</option>
          <option value="actor">Actor</option>
          <option value="genre">Genre</option>
        </select>

        <button onClick={handleSearch} className="films-button">
          Search
        </button>
      </div>

      {searching && <p>Searching...</p>}
      {message && <p className="films-message">{message}</p>}

      <div className="films-results">
        {films.map((film) => (
          <div
            key={film.film_id}
            className="film-card"
            onClick={() => {
              setSelectedFilm(film);
              setCustomerId("");
              setMessage("");
            }}
          >
            <h3>{film.title}</h3>
            <p>{film.release_year}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedFilm && (
        <div className="modal-overlay">
          <div className="film-modal">

            <button
              className="close-button"
              onClick={() => setSelectedFilm(null)}
            >
              ✖
            </button>

            <h2>
              {selectedFilm.title} ({selectedFilm.release_year})
            </h2>

            <p>{selectedFilm.description}</p>

            <p>
              <strong>Actors:</strong> {selectedFilm.actors}
            </p>

            <p>
              <strong>Genres:</strong> {selectedFilm.genres}
            </p>

            {/* Customer ID Input */}
            <div className="rent-section">
              <label>Customer ID:</label>
              <input
                type="number"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Enter your customer ID"
                className="customer-input"
              />
            </div>

            <button
              className="rent-button"
              onClick={handleRent}
            >
              Rent Film
            </button>

            {message && <p className="films-message">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default FilmSearch;

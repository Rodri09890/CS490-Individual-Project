import React, { useState } from "react";

function FilmSearch() {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [films, setFilms] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        try {
            setSearching(true);
            setFilms([]);

            const response = await fetch(`http://localhost:5000/api/search?q=${query}&filter=${filter}`);
            const data = await response.json();
            setFilms(data);
        }catch (err) {
            console.error("Error searching films: ", err);
        } finally {
            setSearching(false);
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

        <select value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="films-select"
        >
          <option value="title">Title</option>
          <option value="actor">Actor</option>
          <option value="genre">Genre</option>
        </select>

        <button onClick={handleSearch} className="films-button">Search</button>
      </div>
      {searching && <p className="loading-text">Searching...</p>}

      <div className="films-results">
        {films.map((film) => (
          <div key={film.film_id} className="film-card">
            <h3>{film.title} ({film.release_year})</h3>
            <p>{film.description}</p>
            <p><strong>Actors:</strong> {film.actors}</p>
            <p><strong>Genres:</strong> {film.genres}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FilmSearch;

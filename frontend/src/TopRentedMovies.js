import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function TopRentedMovies() {
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null)
    const [loadingDetails, setLoadingDetails] = useState(false)


    useEffect(() => {
        const fetchTopMovies = async () => {
        try {
            const response = await axios.get("http://localhost:5000/top-rented");
            setMovies(response.data);
        } catch (err) {
        console.error("Error fetching top rented movies:", err);
        }
    };

        fetchTopMovies();
    }, []);

    const handleViewDetails = async (filmID) => {
        try {
            setLoadingDetails(true);
            const response = await axios.get(`http://localhost:5000/films/${filmID}`)
            setSelectedMovie(response.data);
        } catch (err) {
            console.error("Error fetching film details: ", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="top-movies">
            <h1>Top 5 Films</h1>
            {movies.length === 0 ? (
                <p>Loading...</p>
            ) : (
            <div className="film">
                {movies.map((movie, index) => (
                <div key={movie.film_id} className="film-card">
                    <h2>
                        {index + 1}. {movie.title}
                    </h2>
                    <p>Times Rented: {movie.rental_count}</p>
                    <button onClick={() => handleViewDetails(movie.film_id)}>
                        Details
                    </button>
                    <hr />
                </div>
                ))}
            </div>
            )}
            {loadingDetails && <p>Loading Details...</p>}

            {selectedMovie && (
                <div className="modal" onClick={() => setSelectedMovie(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedMovie.title}</h2>
                        <p>{selectedMovie.description}</p>
                        <p>Release Year: {selectedMovie.release_year}</p>
                        <p>Rental Rate: ${selectedMovie.rental_rate}</p>
                        <p>Length: {selectedMovie.length} minutes</p>
                        <p>Rating: {selectedMovie.rating}</p>

                        <button onClick={() => setSelectedMovie(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TopRentedMovies;

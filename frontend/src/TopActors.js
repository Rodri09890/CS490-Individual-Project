import { useEffect, useState } from "react";
import axios from "axios";

function TopActors() {
    const [actors, setActors] = useState([]);
    const [selectedActor, setSelectedActor] = useState(null)
    const [topMovies, setTopMovies] = useState([])
    const [loadingDetails, setLoadingDetails] = useState(false)

    useEffect(() => {
        const fetchTopActors = async () => {
        try {
            const response = await axios.get("http://localhost:5000/top-actors");
            setActors(response.data);
        } catch (err) {
        console.error("Error fetching top actors:", err);
        }
    };

        fetchTopActors();
    }, []);

    const handleViewActorDetails = async (actor) => {
        try {
            setLoadingDetails(true);
            setSelectedActor(actor);
            setTopMovies([]);

            const response = await axios.get(`http://localhost:5000/actor/${actor.actor_id}/top-movies`)
            setTopMovies(response.data);
        } catch (err) {
            console.error("Error fetching actor details: ", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="top-actors">
            <h1>Top 5 Actors</h1>
            {actors.length === 0 ? (
                <p>Loading...</p>
            ) : (
            <div className="actor">
                {actors.map((actor) => (
                <div key={actor.actor_id} className="actor-card">
                    <h2>
                        {actor.first_name}
                    </h2>
                    <h2>{actor.last_name}</h2>
                    <p>Film Count: {actor.film_count}</p>
                    <button onClick={() => handleViewActorDetails(actor)}>
                        Details
                    </button>
                    <hr />
                </div>
                ))}
            </div>
            )}

            {loadingDetails && <p>Loading Details...</p>}

            {selectedActor && (
                <div className="modal" onClick={() => setSelectedActor(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedActor.first_name}{" "}{selectedActor.last_name}</h2>
                        <p>Actor ID: {selectedActor.actor_id}</p>
                        <p>Top 5 Rented Films:</p>
                        <div className="actor-top-five">
                            <ol className="top-five">
                                {topMovies.map((movie) => (
                                <li key={movie.film_id}>
                                    {movie.title}
                                </li>
                                ))}
                            </ol>
                        </div>
                        <button onClick={() => setSelectedActor(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TopActors;

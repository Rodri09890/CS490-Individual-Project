import TopActors from "./TopActors";
import TopRentedMovies from "./TopRentedMovies";

function Landing() {

    return ( 
        <div className="landing">
            {<TopRentedMovies/>}
            {<TopActors/>}
        </div>
     );
}
 
export default Landing;
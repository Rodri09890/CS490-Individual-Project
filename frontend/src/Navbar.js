import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <h1>Rodrigo's Film Rental</h1>
      <div className="links">
        <Link to="/">Home</Link>
        <Link to="/films">Films</Link>
        <Link to="/customer">Customer</Link>
      </div>
    </nav>
  );
}
 
export default Navbar;
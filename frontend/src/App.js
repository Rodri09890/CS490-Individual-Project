import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import NotFound from "./NotFound";
import FilmSearch from "./FilmSearch";
import Landing from "./Landing";
import UsersPage from "./UsersPage";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar/>
        <div className="content">
          <Routes>
            <Route exact path="/" element={<Landing/>}/>
            <Route path="/films" element={<FilmSearch/>}/>
            <Route path="/customer" element={<UsersPage/>}/>
            <Route path="/*" element={<NotFound/>}/>
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

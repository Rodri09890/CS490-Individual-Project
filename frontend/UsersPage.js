import React, { useEffect, useState } from "react";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const limit = 10;

  const fetchUsers = async (pageNumber = 1, searchTerm = search) => {
    const response = await fetch(
      `http://localhost:5000/api/users?page=${pageNumber}&limit=${limit}&search=${searchTerm}`
    );
    const data = await response.json();

    setUsers(data.data);
    setTotalPages(data.total_pages);
    setPage(data.page);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => {
    fetchUsers(1, search); // Reset to page 1 on new search
  };

  const handleReset = () => {
    setSearch("");
    fetchUsers(1, ""); // go back to page 1 with empty search
  };

  return (
    <div className="customers-container">
      <h2 className="customers-title">Customers</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by first name, last name or customer id!"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        className="search-input"/>
        <button onClick={handleSearch} className="search-button">Search</button>
      
        <button onClick={handleReset} className="reset-button">Reset</button>
      </div>

      <table className="customers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Active</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.customer_id}>
              <td>{user.customer_id}</td>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td>{user.active ? "Yes" : "No"}</td>
              <td>{user.create_date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => fetchUsers(page - 1)}
        className="previous-page">
          Previous
        </button>

        <span className="current-page">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => fetchUsers(page + 1)}
        className="next-page">
          Next
        </button>
      </div>
    </div>
  );
}

export default UsersPage;

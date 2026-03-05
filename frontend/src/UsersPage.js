import React, { useEffect, useState } from "react";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [showRentalModal, setShowRentalModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [rentalHistory, setRentalHistory] = useState([]);

  const limit = 10;

  // ---------------- FETCH USERS ----------------
  const fetchUsers = async (pageNumber = 1, searchTerm = search) => {
    const response = await fetch(
      `http://localhost:5000/api/users?page=${pageNumber}&limit=${limit}&search=${searchTerm}`
    );
    const data = await response.json();
    setUsers(data.data);
    setTotalPages(data.total_pages);
    setPage(data.page);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = () => { fetchUsers(1, search); };
  const handleReset = () => { setSearch(""); fetchUsers(1, ""); };

  // ---------------- CRUD ----------------
  const handleSaveUser = async (user) => {
    const method = user.customer_id ? "PUT" : "POST";
    const url = user.customer_id
      ? `http://localhost:5000/api/users/${user.customer_id}`
      : "http://localhost:5000/api/users";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setShowUserModal(false);
        fetchUsers(page);
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        fetchUsers(page);
      } else { setMessage(data.error); }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  // ---------------- VIEW RENTALS ----------------
  const viewCustomerRentals = async (customerId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${customerId}/rentals`);
      const data = await response.json();
      if (response.ok) {
        setSelectedCustomer(data.customer);
        setRentalHistory(data.rentals);
        setShowRentalModal(true);
      } else {
        alert(data.error || "Could not fetch rentals");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // ---------------- MODALS ----------------
  const UserModal = ({ user, onClose, onSave }) => {
    const [firstName, setFirstName] = useState(user?.first_name || "");
    const [lastName, setLastName] = useState(user?.last_name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [active, setActive] = useState(user?.active ?? 1);

    const handleSubmit = () => {
      if (!firstName || !lastName) {
        alert("First name and last name are required");
        return;
      }
      onSave({
        customer_id: user?.customer_id,
        first_name: firstName,
        last_name: lastName,
        email,
        active,
      });
    };

    return (
      <div className="modal-overlay">
        <div className="user-modal">
          <button className="close-button" onClick={onClose}>×</button>
          <h2>{user ? "Edit Customer" : "Add Customer"}</h2>
          <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select value={active} onChange={(e) => setActive(parseInt(e.target.value))}>
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
          <button onClick={handleSubmit}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  };

  const RentalModal = ({ customer, onClose }) => {
  const [rentals, setRentals] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5; // rentals per page
  const [loading, setLoading] = useState(false);

  const fetchRentals = async (pageNumber = 1) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${customer.customer_id}/rentals?page=${pageNumber}&limit=${limit}`
      );
      const data = await response.json();
      if (response.ok || !data.error) {
        setRentals(data.rentals);
        setTotalPages(data.total_pages);
        setPage(data.page);
      } else {
        alert(data.error || "Could not fetch rentals");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  useEffect(() => {
    fetchRentals(1);
  }, [customer.customer_id]);

  
  const handleReturn = async (rentalId) => {
    if (!window.confirm("Mark this film as returned?")) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rental_id: rentalId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchRentals(page); // refresh rental list
      } else {
        alert(data.error || "Failed to return film");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="user-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{customer.first_name} {customer.last_name}</h2>

        <h3>Rental History</h3>
        <table className="customers-table">
          <thead>
            <tr>
              <th>Film</th>
              <th>Rented On</th>
              <th>Returned On</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rentals.length === 0 ? (
              <tr><td colSpan="4">No rentals found</td></tr>
            ) : (
              rentals.map(r => (
                <tr key={r.rental_id}>
                  <td>{r.title}</td>
                  <td>{new Date(r.rental_date).toLocaleDateString()}</td>
                  <td>{r.return_date ? new Date(r.return_date).toLocaleDateString() : "Not returned"}</td>
                  <td>
                    {!r.return_date && (
                      <button
                        onClick={() => handleReturn(r.rental_id)}
                        disabled={loading}
                      >
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>

          <div className="rentals-pagination">
            <button
              disabled={page === 1}
              onClick={() => fetchRentals(page - 1)}
              className="previous-page"
            >
              Previous
            </button>
            <span className="current-page">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => fetchRentals(page + 1)}
              className="next-page"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      );
    };
 
  return (
    <div className="customers-container">
      <h2 className="customers-title">Customers</h2>
      {message && <p className="message">{message}</p>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by first name, last name or customer id!"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">Search</button>
        <button onClick={handleReset} className="reset-button">Reset</button>
        <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="add-button">Add Customer</button>
      </div>

      <table className="customers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Active</th>
            <th>Created</th>
            <th>Actions</th>
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
              <td>
                <button onClick={() => { setEditingUser(user); setShowUserModal(true); }}>Edit</button>
                <button onClick={() => handleDeleteUser(user.customer_id)}>Delete</button>
                <button onClick={() => viewCustomerRentals(user.customer_id)}>View Rentals</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => fetchUsers(page - 1)} className="previous-page">Previous</button>
        <span className="current-page">Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => fetchUsers(page + 1)} className="next-page">Next</button>
      </div>

      {showUserModal && <UserModal user={editingUser} onClose={() => setShowUserModal(false)} onSave={handleSaveUser} />}
      {showRentalModal && <RentalModal customer={selectedCustomer} rentals={rentalHistory} onClose={() => setShowRentalModal(false)} />}
    </div>
  );
}

export default UsersPage;

"use client";
import { useState, useEffect } from "react";

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [search, setSearch] = useState("");
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const fetchRooms = async (q = "") => {
    const res = await fetch(`/api/rooms${q ? "?q=" + q : ""}`);
    const data = await res.json();
    setRooms(data.data);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const createRoom = async () => {
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "" });
    fetchRooms();
  };

  const saveEdit = async () => {
    if (editingRoom) {
      await fetch("/api/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRoom),
      });
      setEditingRoom(null);
      fetchRooms();
    }
  };

  const deleteRoom = async (id: string) => {
    if(confirm("Delete room?")) {
      await fetch("/api/rooms?id=" + id, { method: "DELETE" });
      fetchRooms();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl mb-4">Rooms CRUD</h1>
      <div className="mb-4">
        <input
          className="p-2 rounded bg-gray-800 text-white"
          placeholder="Search rooms"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => fetchRooms(search)} className="ml-2 p-2 bg-blue-600 rounded">Search</button>
      </div>
      <div className="mb-4">
        <input
          className="p-2 rounded bg-gray-800 text-white"
          placeholder="Room name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <button onClick={createRoom} className="ml-2 p-2 bg-green-600 rounded">Create</button>
      </div>
      
      {editingRoom && (
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <h2 className="text-xl mb-2">Edit Room</h2>
          <input
            className="p-2 mb-2 rounded bg-gray-700 text-white block"
            type="text"
            placeholder="Name"
            value={editingRoom.name || ""}
            onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
          />
          <input
            className="p-2 mb-2 rounded bg-gray-700 text-white block"
            type="text"
            placeholder="Description"
            value={editingRoom.description || ""}
            onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
          />
          <input
            className="p-2 mb-2 rounded bg-gray-700 text-white block"
            type="number"
            placeholder="Capacity"
            value={editingRoom.capacity || 0}
            onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })}
          />
          <button onClick={saveEdit} className="mr-2 p-2 bg-green-600 rounded">Save</button>
          <button onClick={() => setEditingRoom(null)} className="p-2 bg-red-600 rounded">Cancel</button>
        </div>
      )}

      <ul>
        {rooms.map((room: any) => (
          <li key={room._id} className="mb-2">
            <span>{room.name}</span>
            <button onClick={() => setEditingRoom(room)} className="ml-2 p-1 bg-yellow-600 rounded">Update</button>
            <button onClick={() => deleteRoom(room._id)} className="ml-2 p-1 bg-red-600 rounded">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomsPage;

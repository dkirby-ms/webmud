"use client";
import { useState, useEffect } from "react";

const WorldsPage = () => {
  const [worlds, setWorlds] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [search, setSearch] = useState("");

  const fetchWorlds = async (q = "") => {
    const res = await fetch(`/api/worlds${q ? "?q=" + q : ""}`);
    const data = await res.json();
    setWorlds(data.data);
  };

  useEffect(() => {
    fetchWorlds();
  }, []);

  const createWorld = async () => {
    await fetch("/api/worlds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "" });
    fetchWorlds();
  };

  const updateWorld = async (id: string) => {
    const newName = prompt("New name:");
    if(newName) {
      await fetch("/api/worlds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName }),
      });
      fetchWorlds();
    }
  };

  const deleteWorld = async (id: string) => {
    if(confirm("Delete world?")) {
      await fetch("/api/worlds?id=" + id, { method: "DELETE" });
      fetchWorlds();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl mb-4">Worlds CRUD</h1>
      <div className="mb-4">
        <input
          className="p-2 rounded bg-gray-800 text-white"
          placeholder="Search worlds"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => fetchWorlds(search)} className="ml-2 p-2 bg-blue-600 rounded">Search</button>
      </div>
      <div className="mb-4">
        <input
          className="p-2 rounded bg-gray-800 text-white"
          placeholder="World name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <button onClick={createWorld} className="ml-2 p-2 bg-green-600 rounded">Create</button>
      </div>
      <ul>
        {worlds.map((world: any) => (
          <li key={world._id} className="mb-2">
            <span>{world.name}</span>
            <button onClick={() => updateWorld(world._id)} className="ml-2 p-1 bg-yellow-600 rounded">Update</button>
            <button onClick={() => deleteWorld(world._id)} className="ml-2 p-1 bg-red-600 rounded">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorldsPage;

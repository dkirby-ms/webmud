"use client";
import { useState, useEffect } from "react";

const GameObjectsPage = () => {
  const [gameObjects, setGameObjects] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [search, setSearch] = useState("");

  const fetchGameObjects = async (q = "") => {
    const res = await fetch(`/api/gameObjects${q ? "?q=" + q : ""}`);
    const data = await res.json();
    setGameObjects(data.data);
  };

  useEffect(() => {
    fetchGameObjects();
  }, []);

  const createGameObject = async () => {
    await fetch("/api/gameObjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "" });
    fetchGameObjects();
  };

  const updateGameObject = async (id: string) => {
    const newName = prompt("New name:");
    if(newName) {
      await fetch("/api/gameObjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName }),
      });
      fetchGameObjects();
    }
  };

  const deleteGameObject = async (id: string) => {
    if(confirm("Delete game object?")) {
      await fetch("/api/gameObjects?id=" + id, { method: "DELETE" });
      fetchGameObjects();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl mb-4">GameObjects CRUD</h1>
      <div className="mb-4">
        <input
          className="p-2 rounded bg-gray-800 text-white"
          placeholder="Search game objects"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => fetchGameObjects(search)} className="ml-2 p-2 bg-blue-600 rounded">Search</button>
      </div>
      <div className="mb-4">
        <input
          className="p-2 rounded bg-gray-800 text-white"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <button onClick={createGameObject} className="ml-2 p-2 bg-green-600 rounded">Create</button>
      </div>
      <ul>
        {gameObjects.map((obj: any) => (
          <li key={obj._id} className="mb-2">
            <span>{obj.name}</span>
            <button onClick={() => updateGameObject(obj._id)} className="ml-2 p-1 bg-yellow-600 rounded">Update</button>
            <button onClick={() => deleteGameObject(obj._id)} className="ml-2 p-1 bg-red-600 rounded">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameObjectsPage;

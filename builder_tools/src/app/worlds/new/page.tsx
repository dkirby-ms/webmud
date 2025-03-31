export default function NewWorld() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Create New World</h1>
      </header>

      <main>
        <form className="max-w-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">World Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter world name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded"
              rows={4}
              placeholder="Enter world description"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create World
          </button>
        </form>
      </main>
    </div>
  );
}

import { Suspense } from 'react';
import Link from 'next/link';

async function getWorlds() {
  const res = await fetch('http://localhost:3000/api/worlds', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch worlds');
  return res.json();
}

async function WorldsList() {
  const worlds = await getWorlds();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {worlds.map((world: any) => (
        <div key={world._id} className="p-4 border rounded-lg shadow hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold">{world.name}</h3>
          <p className="text-sm text-gray-600">{world.description}</p>
          <Link 
            href={`/worlds/${world._id}`}
            className="mt-2 inline-block text-blue-600 hover:underline"
          >
            Manage World →
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">World Builder Dashboard</h1>
        <p className="text-gray-600">webMUD editor</p>
      </header>

      <main>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Game Worlds</h2>
          <Link
            href="/worlds/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New World
          </Link>
        </div>

        <Suspense fallback={<div>Loading worlds...</div>}>
          <WorldsList />
        </Suspense>
      </main>
    </div>
  );
}

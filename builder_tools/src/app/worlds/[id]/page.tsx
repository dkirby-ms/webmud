import { notFound } from 'next/navigation';
import WorldEditForm from '../../../components/WorldEditForm';
import { World } from '../../../types/database';
import React from 'react';

async function getWorld(id: string) {
  const res = await fetch(`http://localhost:3000/api/worlds/${id}`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch world');
  }
  return res.json();
}

export default async function WorldPage({ params }: { params: { id: string } }) {
  // Await params before accessing its properties
  const { id } = await params;
  const world = await getWorld(id);
  
  if (!world) {
    notFound();
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Edit World: {world.name}</h1>
      </header>

      <main>
        <WorldEditForm world={world} redirectUrl="/" />
      </main>
    </div>
  );
}

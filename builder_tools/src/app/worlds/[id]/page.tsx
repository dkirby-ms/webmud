'use client';

import { useEffect, useState } from 'react';
import type { World } from '@/types/database';
import Link from 'next/link';

export default function EditWorld({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params;
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{name: string; description: string}>({
    name: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetch(`/api/worlds/${id}`)
      .then(res => res.json())
      .then(data => {
        setWorld(data);
        setFormData({
          name: data.name || '',
          description: data.description || ''
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch world:', error);
        setLoading(false);
      });
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    
    try {
      const response = await fetch(`/api/worlds/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSaveMessage('World updated successfully!');
        // Update the local world state with the new data
        setWorld(prev => prev ? {...prev, ...formData} : null);
      } else {
        const error = await response.json();
        setSaveMessage(`Error: ${error.message || 'Failed to update world'}`);
      }
    } catch (error) {
      console.error('Failed to save world:', error);
      setSaveMessage('Error: Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!world) return <div>World not found</div>;

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Edit World</h1>
        <Link 
          href="/" 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Return to Dashboard
        </Link>
      </header>

      <main>
        {saveMessage && (
          <div className={`p-4 mb-4 rounded ${saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {saveMessage}
          </div>
        )}
        
        <form className="max-w-2xl space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">World Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter world name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="w-full p-2 border rounded"
              rows={4}
              placeholder="Enter world description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Vote } from '@/lib/types';
import { format } from 'date-fns';
import { Star, Search, Trash2, Loader2 } from 'lucide-react';

interface GroupedVote {
  productId: string;
  productName: string;
  count: number;
  votes: Vote[];
}

export default function VotesPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'votes'), orderBy('createdAt', 'desc')));
      setVotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vote)));
    } catch {
      // votes collection may not exist yet
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this vote?')) return;
    setDeleting(id);
    await deleteDoc(doc(db, 'votes', id));
    setVotes((prev) => prev.filter((v) => v.id !== id));
    setDeleting(null);
  };

  // Group by product
  const grouped = votes.reduce<Record<string, GroupedVote>>((acc, vote) => {
    const key = vote.productId;
    if (!acc[key]) {
      acc[key] = { productId: key, productName: vote.productName, count: 0, votes: [] };
    }
    acc[key].count++;
    acc[key].votes.push(vote);
    return acc;
  }, {});

  const groups = Object.values(grouped)
    .sort((a, b) => b.count - a.count)
    .filter(
      (g) =>
        !search ||
        g.productName.toLowerCase().includes(search.toLowerCase()) ||
        g.productId.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Votes & Wishlist</h1>
        <p className="mt-1 text-sm text-gray-500">
          {votes.length} total vote(s) across {Object.keys(grouped).length} product(s)
        </p>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name…"
          className="flex-1 text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <Star size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">
            {search ? 'No votes match your search' : 'No votes yet — customers can vote on the main site'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.productId} className="rounded-2xl bg-white shadow-sm">
              <button
                onClick={() => setExpanded(expanded === group.productId ? null : group.productId)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                    <Star size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{group.productName}</p>
                    <p className="text-xs text-gray-400">ID: {group.productId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                    {group.count} vote{group.count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-400">{expanded === group.productId ? '▲' : '▼'}</span>
                </div>
              </button>

              {expanded === group.productId && (
                <div className="border-t border-gray-100 px-6 pb-4 pt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.votes.map((vote) => (
                        <tr key={vote.id}>
                          <td className="py-2 text-gray-700">{vote.email}</td>
                          <td className="py-2 text-gray-400">
                            {vote.createdAt?.seconds
                              ? format(new Date(vote.createdAt.seconds * 1000), 'd MMM yyyy')
                              : '—'}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => vote.id && handleDelete(vote.id)}
                              disabled={deleting === vote.id}
                              className="text-gray-300 hover:text-red-400"
                            >
                              {deleting === vote.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

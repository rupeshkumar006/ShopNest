import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';

interface Subscriber {
  id: number;
  email: string;
  name: string;
  subscribed_at: string;
}

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Subscriber | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSubs, setSelectedSubs] = useState<Subscriber[]>([]);

  useEffect(() => {
    const loadSubscribers = async () => {
      try {
        const response = await apiService.get<Subscriber[]>('/backend/admin/get_subscribers.php');
        if (response.success && response.data) {
          setSubscribers(response.data);
        } else {
          setError(response.error?.message || 'Failed to fetch subscribers');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    loadSubscribers();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    setSendResult('');
    try {
      const response = await apiService.post('/backend/admin/send_custom_newsletter.php', {
        email: selected.email,
        subject,
        message,
      });

      if (response.success) {
        setSendResult('✅ Email sent!');
        setSubject('');
        setMessage('');
      } else {
        setSendResult('❌ ' + (response.error?.message || 'Failed to send email'));
      }
    } catch {
      setSendResult('❌ Network error');
    }
    setSending(false);
  };

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(search.toLowerCase()) ||
    (sub.name && sub.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-pink-600 mb-8">Newsletter Subscribers</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div className="text-lg font-semibold text-gray-700">Total Subscribers: {filteredSubscribers.length}</div>
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border-2 border-pink-200 rounded-lg p-2 focus:outline-none focus:border-pink-400"
        />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <form onSubmit={e => { e.preventDefault(); }}>
            <table className="w-full mb-8 border rounded-xl overflow-hidden shadow-lg">
              <thead className="bg-pink-100">
                <tr>
                  <th className="py-2 px-4 text-left"><input type="checkbox" checked={selectedSubs.length === filteredSubscribers.length && filteredSubscribers.length > 0} onChange={e => setSelectedSubs(e.target.checked ? filteredSubscribers : [])} /></th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Subscribed At</th>
                  <th className="py-2 px-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map(sub => (
                  <tr key={sub.id} className="border-b hover:bg-pink-50">
                    <td className="py-2 px-4"><input type="checkbox" checked={selectedSubs.some(s => s.id === sub.id)} onChange={e => setSelectedSubs(e.target.checked ? [...selectedSubs, sub] : selectedSubs.filter(s => s.id !== sub.id))} /></td>
                    <td className="py-2 px-4 font-mono">{sub.email}</td>
                    <td className="py-2 px-4">{sub.name || <span className="text-gray-400">(none)</span>}</td>
                    <td className="py-2 px-4">{new Date(sub.subscribed_at).toLocaleString()}</td>
                    <td className="py-2 px-4">
                      <button
                        className="bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-1 rounded-full font-bold shadow hover:scale-105 transition"
                        onClick={() => setSelected(sub)}
                        type="button"
                      >
                        Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </form>
          {selectedSubs.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-pink-200">
              <h2 className="text-xl font-bold mb-2 text-blue-600">Send Bulk Email to {selectedSubs.length} Subscribers</h2>
              <form onSubmit={async e => {
                e.preventDefault();
                setSending(true);
                setSendResult('');
                let allSuccess = true;
                for (const sub of selectedSubs) {
                  try {
                    const res = await fetch('/backend/admin/send_custom_newsletter.php', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: sub.email, subject, message }),
                    });
                    const data = await res.json();
                    if (!data.success) allSuccess = false;
                  } catch {
                    allSuccess = false;
                  }
                }
                setSendResult(allSuccess ? '✅ All emails sent!' : '❌ Some emails failed to send.');
                setSending(false);
                setSubject('');
                setMessage('');
                setSelectedSubs([]);
              }} className="space-y-4">
                <input
                  type="text"
                  className="w-full border-2 border-pink-200 rounded-lg p-2 focus:outline-none focus:border-pink-400"
                  placeholder="Subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  disabled={sending}
                />
                <textarea
                  className="w-full border-2 border-pink-200 rounded-lg p-2 focus:outline-none focus:border-pink-400"
                  rows={5}
                  placeholder="Message (HTML allowed)"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  disabled={sending}
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-blue-500 text-white font-bold px-6 py-2 rounded-full shadow hover:scale-105 transition"
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : 'Send Bulk Email'}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-full hover:bg-gray-300"
                    onClick={() => { setSelectedSubs([]); setSendResult(''); }}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                </div>
                {sendResult && <div className="mt-2 font-semibold text-center text-green-600">{sendResult}</div>}
              </form>
            </div>
          )}
          {selected && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-pink-200">
              <h2 className="text-xl font-bold mb-2 text-blue-600">Send Custom Email to <span className="text-pink-500">{selected.email}</span></h2>
              <form onSubmit={handleSend} className="space-y-4">
                <input
                  type="text"
                  className="w-full border-2 border-pink-200 rounded-lg p-2 focus:outline-none focus:border-pink-400"
                  placeholder="Subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  disabled={sending}
                />
                <textarea
                  className="w-full border-2 border-pink-200 rounded-lg p-2 focus:outline-none focus:border-pink-400"
                  rows={5}
                  placeholder="Message (HTML allowed)"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  disabled={sending}
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-blue-500 text-white font-bold px-6 py-2 rounded-full shadow hover:scale-105 transition"
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : 'Send Email'}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-full hover:bg-gray-300"
                    onClick={() => { setSelected(null); setSendResult(''); }}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                </div>
                {sendResult && <div className="mt-2 font-semibold text-center text-green-600">{sendResult}</div>}
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminNewsletter; 
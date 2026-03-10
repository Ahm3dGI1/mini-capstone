import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api/api';
import { FiSend, FiMessageCircle, FiX } from 'react-icons/fi';

export default function TutorChat({ sessionId, chatMessages, setChatMessages, currentTime, onChatOpen }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;

    // Add user message optimistically
    const userMsg = { id: Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(sessionId, msg, Math.floor(currentTime));
      // Replace optimistic user message and add assistant message
      setChatMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== userMsg.id);
        return [...filtered, res.data.user_message, res.data.message];
      });
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: 'Sorry, something went wrong. Please try again.', created_at: new Date().toISOString() },
      ]);
    }
    setLoading(false);
  };

  // Mobile collapsed state
  if (isCollapsed) {
    return (
      <button
        onClick={() => {
          setIsCollapsed(false);
          if (onChatOpen) onChatOpen();
        }}
        className="lg:hidden fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-xl hover:bg-primary-700 transition z-40"
      >
        <FiMessageCircle className="text-xl" />
        {chatMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {chatMessages.filter((m) => m.role === 'assistant').length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h3 className="font-semibold text-sm text-gray-800">AI Tutor</h3>
        </div>
        <button onClick={() => setIsCollapsed(true)} className="lg:hidden text-gray-400 hover:text-gray-600">
          <FiX />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-scroll">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <FiMessageCircle className="mx-auto text-3xl mb-2 text-gray-300" />
            <p>Ask me anything about the video!</p>
            <p className="text-xs mt-1">I have full context of the transcript.</p>
          </div>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the video..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend />
          </button>
        </div>
      </form>
    </div>
  );
}

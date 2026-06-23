import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { aiAPI } from '../../services/aiAPI';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "Which products need reordering?",
    "What's my total inventory value?",
    "Show me low stock alerts",
    "Which supplier has most products?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiAPI.chat({ message: text, conversation_history: history });
      const aiMessage = { role: 'assistant', content: response.response, timestamp: new Date().toISOString() };

      setMessages(prev => [...prev, aiMessage]);
      setHistory(prev => [...prev, { role: 'user', parts: [{ text }] }, { role: 'model', parts: [{ text: response.response }] }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all z-40 ${isOpen ? 'scale-0' : 'scale-100 hover:scale-110'} animate-bounce`}
      >
        <MessageSquare size={24} />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">AI</span>
      </button>

      <div className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 transform origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '500px' }}>

        <div className="bg-indigo-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <div>
              <h3 className="font-bold text-sm">AI Inventory Assistant</h3>
              <p className="text-[10px] text-indigo-200">Ask me anything about your stock</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center mt-4">
              <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bot size={24} className="text-indigo-600" />
              </div>
              <p className="text-sm text-gray-600 mb-4">Hello! I'm your AI assistant. How can I help you manage your inventory today?</p>
              <div className="flex flex-col gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-xs bg-white border border-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span className={`text-[10px] block mt-1 ${msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white rounded-b-2xl border-t border-gray-100">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about stock, reorders..."
              className="flex-grow bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2 text-sm transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

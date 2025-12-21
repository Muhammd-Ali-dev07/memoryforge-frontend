import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Send,
  Upload,
  FileText,
  LogOut,
  Plus,
  MessageSquare,
  User,
  Bot,
  Loader2,
  X,
  Menu,
  Settings
} from 'lucide-react';
import './ChatPage.css';

interface Message {
  messageId: string;
  content: string;
  isUserMessage: boolean;
  timestamp: number;
}

interface Chat {
  chatId: string;
  title: string;
  messageCount: number;
}

interface Document {
  documentId: string;
  filename: string;
  chunkCount: number;
  uploadedAt: number;
}

const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [useRAG, setUseRAG] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    loadChats();
    loadDocuments();
  }, []);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat);
    }
  }, [currentChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const response = await fetch('http://13.60.92.19:8080/api/chat/list', {
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data);
        if (data.length > 0 && !currentChat) {
          setCurrentChat(data[0].chatId);
        }
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`http://13.60.92.19:8080/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch('http://13.60.92.19:8080/api/documents/list', {
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch('http://13.60.92.19:8080/api/chat/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: `Chat ${new Date().toLocaleDateString()}` })
      });

      if (response.ok) {
        const data = await response.json();
        await loadChats();
        setCurrentChat(data.chatId);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChat || loading) return;

    const messageContent = input;
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://13.60.92.19:8080/api/chat/message', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: currentChat,
          content: messageContent,
          useRAG
        })
      });

      if (response.ok) {
        await loadMessages(currentChat);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const uploadDocument = async (file: File) => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    // Check file type
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      alert('Please upload only .txt or .md files');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;

      try {
        const response = await fetch('http://13.60.92.19:8080/api/documents/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user?.sessionToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content,
            filename: file.name
          })
        });

        if (response.ok) {
          await loadDocuments();
          setUploadModalOpen(false);
          alert('✅ Document uploaded successfully!');
        } else {
          alert('Failed to upload document');
        }
      } catch (error) {
        console.error('Failed to upload document:', error);
        alert('Error uploading document');
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file');
    };
    
    reader.readAsText(file);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-small">
            <Brain size={32} />
            <span>MemoryForge</span>
          </div>
        </div>

        <div className="sidebar-content">
          <button className="btn btn-primary btn-new-chat" onClick={createNewChat}>
            <Plus size={20} />
            <span>New Chat</span>
          </button>

          <div className="chat-list">
            <h3>Recent Chats</h3>
            {chats.map((chat) => (
              <div
                key={chat.chatId}
                className={`chat-item ${currentChat === chat.chatId ? 'active' : ''}`}
                onClick={() => setCurrentChat(chat.chatId)}
              >
                <MessageSquare size={18} />
                <div className="chat-item-content">
                  <span className="chat-title">{chat.title}</span>
                  <span className="chat-count">{chat.messageCount} messages</span>
                </div>
              </div>
            ))}
          </div>

          <div className="documents-section">
            <div className="documents-header">
              <h3>Documents ({documents.length})</h3>
              <button className="btn-icon" onClick={() => setUploadModalOpen(true)}>
                <Upload size={18} />
              </button>
            </div>
            {documents.map((doc) => (
              <div key={doc.documentId} className="document-item">
                <FileText size={16} />
                <div className="document-info">
                  <span>{doc.filename}</span>
                  <span className="document-chunks">{doc.chunkCount} chunks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <User size={20} />
            <span>{user?.username}</span>
          </div>
          <button className="btn-icon" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
          <button className="btn-icon mobile-only" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <h2>
            {chats.find((c) => c.chatId === currentChat)?.title || 'Select a chat'}
          </h2>
          <div className="rag-toggle">
            <label>
              <input
                type="checkbox"
                checked={useRAG}
                onChange={(e) => setUseRAG(e.target.checked)}
              />
              <span>RAG Mode</span>
            </label>
          </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <Brain size={64} className="empty-icon" />
              <h3>Start a conversation</h3>
              <p>Send a message to begin chatting with AI</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.messageId}
                  className={`message ${message.isUserMessage ? 'user' : 'assistant'}`}
                >
                  <div className="message-icon">
                    {message.isUserMessage ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author">
                        {message.isUserMessage ? 'You' : 'AI Assistant'}
                      </span>
                      <span className="message-time">{formatTimestamp(message.timestamp)}</span>
                    </div>
                    <p className="message-text">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message assistant loading">
                  <div className="message-icon">
                    <Bot size={20} />
                  </div>
                  <div className="message-content">
                    <Loader2 className="spinner-icon" size={24} />
                    <span>AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="input-container">
          <textarea
            className="message-input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <button
            className="btn btn-primary btn-send"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send size={20} />
          </button>
        </div>
      </main>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay" onClick={() => setUploadModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Document</h3>
              <button className="btn-icon" onClick={() => setUploadModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-content">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Upload a text document (.txt or .md file)
              </p>
              <input
                type="file"
                accept=".txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadDocument(file);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
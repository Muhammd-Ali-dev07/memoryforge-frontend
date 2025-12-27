import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
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
  Copy,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import './ChatPage.css';

// HARDCODED API URL - No environment variable needed
const API_URL = 'http://13.60.92.19:8080';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [useRAG, setUseRAG] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  
  // Loading states
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  
  // Copy code states
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const loadChats = async () => {
    setChatsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/list`, {
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load chats');
      }
      
      const data = await response.json();
      setChats(data);
      
      if (data.length > 0 && !currentChat) {
        setCurrentChat(data[0].chatId);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      showError('Failed to load chats. Please refresh the page.');
    } finally {
      setChatsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      showError('Failed to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/documents/list`, {
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load documents');
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      showError('Failed to load documents.');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: `Chat ${new Date().toLocaleDateString()}` })
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const data = await response.json();
      await loadChats();
      setCurrentChat(data.chatId);
    } catch (error) {
      console.error('Failed to create chat:', error);
      showError('Failed to create new chat.');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChat || loading) return;

    const messageContent = input;
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat/message`, {
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

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      await loadMessages(currentChat);
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message. Please try again.');
      setInput(messageContent); // Restore the input
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
      showError('Please select a file');
      return;
    }

    // Check file type
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      showError('Please upload only .txt or .md files');
      return;
    }

    setUploadLoading(true);

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const content = e.target?.result as string;

      try {
        const response = await fetch(`${API_URL}/api/documents/upload`, {
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

        if (!response.ok) {
          throw new Error('Failed to upload document');
        }

        // Refresh documents list
        await loadDocuments();
        setUploadModalOpen(false);
        
        // Show success message
        setError(null);
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<span>✅ Document uploaded successfully!</span>`;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Failed to upload document:', error);
        showError('Error uploading document. Please try again.');
      } finally {
        setUploadLoading(false);
      }
    };
    
    reader.onerror = () => {
      showError('Error reading file');
      setUploadLoading(false);
    };
    
    reader.readAsText(file);
  };

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
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
      {/* Error Toast */}
      {error && (
        <div className="error-toast">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

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
            {chatsLoading ? (
              <div className="loading-state">
                <Loader2 className="spinner-icon" size={24} />
                <span>Loading chats...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="empty-list">
                <p>No chats yet. Create one!</p>
              </div>
            ) : (
              chats.map((chat) => (
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
              ))
            )}
          </div>

          <div className="documents-section">
            <div className="documents-header">
              <h3>Documents ({documents.length})</h3>
              <button 
                className="btn-icon" 
                onClick={() => setUploadModalOpen(true)}
                title="Upload document"
              >
                <Upload size={18} />
              </button>
            </div>
            {documentsLoading ? (
              <div className="loading-state-small">
                <Loader2 className="spinner-icon" size={16} />
                <span>Loading...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="empty-list-small">
                <p>No documents uploaded</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.documentId} className="document-item">
                  <FileText size={16} />
                  <div className="document-info">
                    <span>{doc.filename}</span>
                    <span className="document-chunks">{doc.chunkCount} chunks</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <User size={20} />
            <span>{user?.username}</span>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
          <button 
            className="btn-icon mobile-only" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
          <h2>
            {chats.find((c) => c.chatId === currentChat)?.title || 'Select a chat'}
          </h2>
          <div className="header-actions">
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
            <button 
              className="btn-icon" 
              onClick={() => currentChat && loadMessages(currentChat)}
              title="Refresh messages"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </header>

        <div className="messages-container">
          {messagesLoading ? (
            <div className="loading-container">
              <Loader2 className="spinner-icon" size={48} />
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
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
                    <div className="message-text">
                      {message.isUserMessage ? (
                        <p>{message.content}</p>
                      ) : (
                        <ReactMarkdown
                          components={{
                            code(props) {
                              const { children, className, ...rest } = props;
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              const codeId = `${message.messageId}-${match?.[1] || 'code'}`;
                              
                              return match ? (
                                <div className="code-block">
                                  <div className="code-header">
                                    <span className="code-language">{match[1]}</span>
                                    <button
                                      className="copy-button"
                                      onClick={() => copyToClipboard(codeString, codeId)}
                                    >
                                      {copiedCode === codeId ? (
                                        <>
                                          <Check size={16} />
                                          <span>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={16} />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
  style={vscDarkPlus as any}
  language={match[1]}
  PreTag="div"
  children={codeString}
/>
                                </div>
                              ) : (
                                <code className={className} {...rest}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
                    </div>
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
            disabled={loading || !currentChat}
          />
          <button
            className="btn btn-primary btn-send"
            onClick={sendMessage}
            disabled={!input.trim() || loading || !currentChat}
          >
            {loading ? <Loader2 className="spinner-icon" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </main>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay" onClick={() => !uploadLoading && setUploadModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Document</h3>
              <button 
                className="btn-icon" 
                onClick={() => setUploadModalOpen(false)}
                disabled={uploadLoading}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-content">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Upload a text document (.txt or .md file) for RAG-powered conversations
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadDocument(file);
                  }
                }}
                disabled={uploadLoading}
              />
              {uploadLoading && (
                <div className="upload-progress">
                  <Loader2 className="spinner-icon" size={24} />
                  <span>Uploading and processing document...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;


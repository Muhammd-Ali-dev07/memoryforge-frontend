import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Brain, Send, Upload, FileText, LogOut, Plus, MessageSquare,
  User, Bot, Loader2, X, Menu, Copy, Check, AlertCircle,
  RefreshCw, Trash2, Edit2, Search, Settings, Save, XCircle, Sun, Moon
} from 'lucide-react';
import './ChatPage.css';

const API_URL = 'http://13.60.92.19:8080';
interface Message {
  messageId: string;
  content: string;
  isUserMessage: boolean;
  timestamp: number;
  isEdited?: boolean;
  editedAt?: number;
}

interface Chat {
  chatId: string;
  title: string;
  messageCount: number;
  createdAt: number;
  lastMessageAt: number;
}

interface Document {
  documentId: string;
  filename: string;
  chunkCount: number;
  uploadedAt: number;
  fileSize: number;
}

interface DeleteConfirmation {
  type: 'chat' | 'message' | 'document';
  id: string;
  name: string;
}

const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
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
  const [documentRefreshKey, setDocumentRefreshKey] = useState(0);
  // Error/Success states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  
  // Edit message
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadChats();
    loadDocuments();
  }, []);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat);
      setSearchMode(false);
      setSearchQuery('');
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

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const loadChats = async () => {
    setChatsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/list`, {
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });
      
      if (!response.ok) throw new Error('Failed to load chats');
      
      const data = await response.json();
      setChats(data.sort((a: Chat, b: Chat) => b.lastMessageAt - a.lastMessageAt));
      
      if (data.length > 0 && !currentChat) {
        setCurrentChat(data[0].chatId);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      showError('Failed to load chats');
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
      
      if (!response.ok) throw new Error('Failed to load messages');
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      showError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

 const loadDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/documents/list`, {
        headers: { Authorization: `Bearer ${user?.sessionToken}` },
        cache: 'no-cache' // Prevent caching
      });
      
      if (!response.ok) throw new Error('Failed to load documents');
      
      const data = await response.json();
      console.log('Loaded documents:', data); // Debug log
      setDocuments(data);
      setDocumentRefreshKey(prev => prev + 1); // Force re-render
    } catch (error) {
      console.error('Failed to load documents:', error);
      showError('Failed to load documents');
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

      if (!response.ok) throw new Error('Failed to create chat');

      const data = await response.json();
      await loadChats();
      setCurrentChat(data.chatId);
      showSuccess('New chat created!');
    } catch (error) {
      console.error('Failed to create chat:', error);
      showError('Failed to create new chat');
    }
  };

  const deleteChat = async (chatId: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });

      if (!response.ok) throw new Error('Failed to delete chat');

      showSuccess('Chat deleted successfully!');
      
      if (currentChat === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
      
      await loadChats();
    } catch (error) {
      console.error('Failed to delete chat:', error);
      showError('Failed to delete chat');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  

  const deleteDocument = async (documentId: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });

      if (!response.ok) throw new Error('Failed to delete document');

      showSuccess('Document deleted!');
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      showError('Failed to delete document');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };
  const deleteMessage = async (messageId: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/message/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });

      if (!response.ok) throw new Error('Failed to delete message');

      showSuccess('Message deleted!');
      setDeleteConfirm(null);
      
      // Reload messages
      if (currentChat) {
        await loadMessages(currentChat);
      }
      await loadChats();
    } catch (error) {
      console.error('Failed to delete message:', error);
      showError('Failed to delete message');
    } finally {
      setDeleting(false);
    }
  };
  const handleDelete = () => {
    if (!deleteConfirm) return;

    switch (deleteConfirm.type) {
      case 'chat':
        deleteChat(deleteConfirm.id);
        break;
      case 'message':
        deleteMessage(deleteConfirm.id);
        break;
      case 'document':
        deleteDocument(deleteConfirm.id);
        break;
    }
  };

  const startEditMessage = (message: Message) => {
    setEditingMessage(message.messageId);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const saveEdit = async (messageId: string) => {
    if (!editContent.trim()) {
      showError('Message cannot be empty');
      return;
    }

    setEditLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/message/${messageId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user?.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent })
      });

      if (!response.ok) throw new Error('Failed to edit message');

      showSuccess('Message updated!');
      setEditingMessage(null);
      setEditContent('');
      
      if (currentChat) {
        await loadMessages(currentChat);
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
      showError('Failed to edit message');
    } finally {
      setEditLoading(false);
    }
  };

  const searchMessages = async () => {
    if (!searchQuery.trim()) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: searchQuery, limit: 50 })
      });

      if (!response.ok) throw new Error('Failed to search messages');

      const data = await response.json();
      setSearchResults(data.results);
      setSearchMode(true);
    } catch (error) {
      console.error('Failed to search messages:', error);
      showError('Failed to search messages');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchMessages();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchMode(false);
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

      if (!response.ok) throw new Error('Failed to send message');

      await loadMessages(currentChat);
      await loadChats();
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message');
      setInput(messageContent);
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

    const allowedTypes = ['text/plain', 'text/markdown'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      showError('Only .txt and .md files are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    setUploadLoading(true);
    try {
      const content = await file.text();
      
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

      if (!response.ok) throw new Error('Failed to upload document');

     const data = await response.json();
      setUploadModalOpen(false);
      
      // Immediately reload documents
      await loadDocuments();
      
      showSuccess(`Document uploaded! ${data.chunkCount} chunks created`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      showError('Failed to upload document');
    } finally {
      setUploadLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayMessages = searchMode ? searchResults : messages;

  return (
    <div className="chat-page">
      {/* Toast Notifications */}
      {error && (
        <div className="toast toast-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="toast toast-success">
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete {deleteConfirm.type}</h3>
              <button 
                className="btn-icon" 
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="spinner-icon" size={16} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Brain size={32} />
            <h1>MemoryForge</h1>
          </div>
          <button className="btn-icon mobile-only" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-content">
          {/* Search Bar */}
          <div className="search-section">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              {searchQuery && (
                <button className="btn-icon-small" onClick={clearSearch}>
                  <X size={16} />
                </button>
              )}
            </div>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={searchMessages}
              disabled={!searchQuery.trim() || searching}
            >
              {searching ? <Loader2 className="spinner-icon" size={16} /> : 'Search'}
            </button>
          </div>

          {searchMode && (
            <div className="search-results-header">
              <span>Found {searchResults.length} results</span>
              <button className="btn-text" onClick={clearSearch}>
                Clear search
              </button>
            </div>
          )}

          {/* Chats List */}
          <div className="chats-section">
            <div className="section-header">
              <h3>Chats ({chats.length})</h3>
              <button className="btn-icon" onClick={createNewChat} title="New chat">
                <Plus size={18} />
              </button>
            </div>
            {chatsLoading ? (
              <div className="loading-state-small">
                <Loader2 className="spinner-icon" size={16} />
                <span>Loading...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="empty-list-small">
                <p>No chats yet</p>
                <button className="btn btn-secondary btn-sm" onClick={createNewChat}>
                  Create your first chat
                </button>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.chatId}
                  className={`chat-item ${currentChat === chat.chatId ? 'active' : ''}`}
                  onClick={() => setCurrentChat(chat.chatId)}
                >
                  <MessageSquare size={16} />
                  <div className="chat-info">
                    <span className="chat-title">{chat.title}</span>
                    <span className="chat-count">{chat.messageCount} messages</span>
                  </div>
                  <button
                    className="btn-icon-danger-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ type: 'chat', id: chat.chatId, name: chat.title });
                    }}
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Documents List */}
          <div className="documents-section">
            <div className="section-header">
              <h3>Documents ({documents.length})</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-icon" 
                  onClick={loadDocuments}
                  title="Refresh documents"
                  disabled={documentsLoading}
                >
                  {documentsLoading ? <Loader2 className="spinner-icon" size={16} /> : <RefreshCw size={18} />}
                </button>
                <button 
                  className="btn-icon" 
                  onClick={() => setUploadModalOpen(true)}
                  title="Upload document"
                >
                  <Upload size={18} />
                </button>
              </div>
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
                    <span className="doc-name">{doc.filename}</span>
                    <span className="doc-chunks">{doc.chunkCount} chunks</span>
                  </div>
                  <button
                    className="btn-icon-danger-small"
                    onClick={() => {
                      setDeleteConfirm({ type: 'document', id: doc.documentId, name: doc.filename });
                    }}
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
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
          <button 
            className="btn-icon" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className="btn-icon" 
            onClick={() => navigate('/profile')} 
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button className="btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
          <button 
            className="btn-icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu size={24} />
          </button>
          <h2>
            {searchMode 
              ? `Search Results for "${searchQuery}"`
              : chats.find((c) => c.chatId === currentChat)?.title || 'Select a chat'
            }
          </h2>
          <div className="header-actions">
            {!searchMode && (
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
            )}
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
          ) : displayMessages.length === 0 ? (
            <div className="empty-state">
              <Brain size={64} className="empty-icon" />
              <h3>{searchMode ? 'No results found' : 'Start a conversation'}</h3>
              <p>{searchMode ? 'Try a different search query' : 'Send a message to begin chatting with AI'}</p>
            </div>
          ) : (
            <>
              {displayMessages.map((message) => (
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
                      <div className="message-meta">
                        <span className="message-time">{formatTimestamp(message.timestamp)}</span>
                        {message.isEdited && <span className="edited-badge">Edited</span>}
                        {message.isUserMessage && !searchMode && (
                          <div className="message-actions">
                            <button
                              className="btn-icon-small"
                              onClick={() => startEditMessage(message)}
                              title="Edit message"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn-icon-danger-small"
                              onClick={() => {
                                setDeleteConfirm({ 
                                  type: 'message', 
                                  id: message.messageId, 
                                  name: message.content.substring(0, 50) + '...' 
                                });
                              }}
                              title="Delete message"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="message-text">
                      {editingMessage === message.messageId ? (
                        <div className="edit-container">
                          <textarea
                            className="edit-input"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={cancelEdit}
                              disabled={editLoading}
                            >
                              <XCircle size={16} />
                              Cancel
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => saveEdit(message.messageId)}
                              disabled={editLoading || !editContent.trim()}
                            >
                              {editLoading ? (
                                <>
                                  <Loader2 className="spinner-icon" size={16} />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Save size={16} />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : message.isUserMessage ? (
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

        {!searchMode && (
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
        )}
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
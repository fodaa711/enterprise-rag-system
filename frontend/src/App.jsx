import { useState, useRef, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend.up.railway.app'

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080b0f;
    --surface: #0e1318;
    --surface2: #141b22;
    --border: #1e2a35;
    --accent: #00e5ff;
    --accent2: #7b61ff;
    --text: #e8edf2;
    --muted: #4a5568;
    --success: #00c896;
    --error: #ff4757;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    height: 100vh;
    overflow: hidden;
  }

  #root {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app {
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 100vh;
    overflow: hidden;
  }

  /* SIDEBAR */
  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 28px 24px 20px;
    border-bottom: 1px solid var(--border);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .logo-text {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .logo-sub {
    font-size: 11px;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* UPLOAD AREA */
  .upload-section {
    padding: 20px;
    border-bottom: 1px solid var(--border);
  }

  .section-label {
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    color: var(--muted);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .upload-zone {
    border: 1.5px dashed var(--border);
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--bg);
  }

  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--accent);
    background: rgba(0, 229, 255, 0.03);
  }

  .upload-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .upload-text {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
  }

  .upload-text span {
    color: var(--accent);
    font-weight: 600;
  }

  .file-input {
    display: none;
  }

  /* UPLOADED FILES */
  .files-list {
    padding: 0 20px;
    flex: 1;
    overflow-y: auto;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--bg);
    border-radius: 8px;
    margin-bottom: 8px;
    border: 1px solid var(--border);
    font-size: 12px;
  }

  .file-icon { font-size: 16px; }

  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text);
  }

  .file-status {
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .file-status.success {
    background: rgba(0, 200, 150, 0.1);
    color: var(--success);
  }

  .file-status.loading {
    background: rgba(0, 229, 255, 0.1);
    color: var(--accent);
  }

  .file-status.error {
    background: rgba(255, 71, 87, 0.1);
    color: var(--error);
  }

  /* MAIN CHAT */
  .main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .chat-header {
    padding: 20px 32px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface);
  }

  .chat-title {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    color: var(--success);
    background: rgba(0, 200, 150, 0.08);
    padding: 5px 12px;
    border-radius: 20px;
    border: 1px solid rgba(0, 200, 150, 0.2);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    background: var(--success);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* MESSAGES */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--muted);
    text-align: center;
  }

  .empty-icon {
    font-size: 48px;
    opacity: 0.3;
  }

  .empty-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    opacity: 0.4;
  }

  .empty-sub {
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    opacity: 0.5;
  }

  .message {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .message.user { flex-direction: row-reverse; }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .avatar.user-avatar {
    background: linear-gradient(135deg, var(--accent2), #b56bff);
  }

  .avatar.ai-avatar {
    background: linear-gradient(135deg, var(--accent), #00b4cc);
  }

  .bubble {
    max-width: 70%;
    padding: 14px 18px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.7;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 300;
  }

  .message.user .bubble {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    border-top-right-radius: 2px;
  }

  .message.ai .bubble {
    background: rgba(0, 229, 255, 0.04);
    border: 1px solid rgba(0, 229, 255, 0.12);
    color: var(--text);
    border-top-left-radius: 2px;
  }

  .typing-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 4px 0;
  }

  .typing-dot {
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    animation: typing 1.2s infinite;
  }

  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typing {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }

  /* INPUT AREA */
  .input-area {
    padding: 20px 32px 28px;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }

  .input-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 16px;
    transition: border-color 0.2s;
  }

  .input-row:focus-within {
    border-color: rgba(0, 229, 255, 0.3);
  }

  .text-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 300;
    resize: none;
    max-height: 120px;
    line-height: 1.6;
  }

  .text-input::placeholder {
    color: var(--muted);
  }

  .send-btn {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    flex-shrink: 0;
    font-size: 16px;
  }

  .send-btn:hover { opacity: 0.9; transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

  .hint {
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    color: var(--muted);
    margin-top: 10px;
    text-align: center;
    letter-spacing: 0.05em;
  }

  /* SESSION */
  .session-info {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    margin-top: auto;
  }

  .session-id {
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .new-session-btn {
    margin-top: 8px;
    width: 100%;
    padding: 8px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--muted);
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .new-session-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
`

function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9)
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [sessionId, setSessionId] = useState(generateSessionId())
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') return

    const fileEntry = { name: file.name, status: 'loading', id: Date.now() }
    setFiles(prev => [...prev, fileEntry])

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/ingest`, { method: 'POST', body: formData })
      const data = await res.json()
      setFiles(prev => prev.map(f =>
        f.id === fileEntry.id
          ? { ...f, status: 'success', chunks: data.chunks_indexed }
          : f
      ))
    } catch {
      setFiles(prev => prev.map(f =>
        f.id === fileEntry.id ? { ...f, status: 'error' } : f
      ))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileUpload(file)
  }

  const handleSend = async () => {
    if (!question.trim() || loading) return

    const q = question.trim()
    setQuestion('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    // Add placeholder AI message
    setMessages(prev => [...prev, { role: 'ai', content: '', streaming: true }])

    try {
      const res = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, session_id: sessionId }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullText += chunk
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: fullText, streaming: true } : m
        ))
      }

      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, streaming: false } : m
      ))
    } catch {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1
          ? { ...m, content: 'Error connecting to backend. Please try again.', streaming: false }
          : m
      ))
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const newSession = () => {
    setSessionId(generateSessionId())
    setMessages([])
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-icon">🧠</div>
              <div className="logo-text">RAG SYSTEM</div>
            </div>
            <div className="logo-sub">Enterprise Intelligence</div>
          </div>

          <div className="upload-section">
            <div className="section-label">Knowledge Base</div>
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon">📄</div>
              <div className="upload-text">
                <span>Click to upload</span> or drag & drop<br />PDF files only
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="file-input"
              onChange={(e) => handleFileUpload(e.target.files[0])}
            />
          </div>

          <div className="files-list" style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
            {files.length > 0 && <div className="section-label">Uploaded Files</div>}
            {files.map(file => (
              <div key={file.id} className="file-item">
                <span className="file-icon">📑</span>
                <span className="file-name">{file.name}</span>
                <span className={`file-status ${file.status}`}>
                  {file.status === 'loading' ? '...' : file.status === 'success' ? `${file.chunks}c` : 'err'}
                </span>
              </div>
            ))}
          </div>

          <div className="session-info">
            <div className="session-id">
              <span>🔑</span>
              <span>{sessionId.substring(0, 20)}...</span>
            </div>
            <button className="new-session-btn" onClick={newSession}>
              + New Session
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="chat-header">
            <div className="chat-title">Document Intelligence Chat</div>
            <div className="status-badge">
              <div className="status-dot"></div>
              CONNECTED
            </div>
          </div>

          <div className="messages">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <div className="empty-title">Ready to Analyze</div>
                <div className="empty-sub">Upload a PDF → Ask anything</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className={`avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="bubble">
                  {msg.content === '' && msg.streaming ? (
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-row">
              <textarea
                ref={textareaRef}
                className="text-input"
                placeholder="Ask anything about your documents..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button className="send-btn" onClick={handleSend} disabled={loading || !question.trim()}>
                ➤
              </button>
            </div>
            <div className="hint">ENTER to send · SHIFT+ENTER for new line</div>
          </div>
        </div>
      </div>
    </>
  )
}
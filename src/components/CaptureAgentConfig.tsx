import { useState } from 'react'
import { useSessionStore } from '../stores/sessionStore'

export function CaptureAgentConfig() {
  const { captureAgents, addCaptureAgent, removeCaptureAgent, channels } = useSessionStore()
  const [isAdding, setIsAdding] = useState(false)
  const [agentUrl, setAgentUrl] = useState('http://localhost:8090')
  const [channelId, setChannelId] = useState('')

  const handleAdd = () => {
    if (!agentUrl.trim() || !channelId.trim()) return

    const agentId = `agent-${Date.now()}`
    addCaptureAgent({
      id: agentId,
      channelId,
      url: agentUrl.trim(),
      status: 'connected',
    })

    setAgentUrl('http://localhost:8090')
    setChannelId('')
    setIsAdding(false)
  }

  return (
    <div className="capture-agent-config">
      <div className="config-header">
        <h3>Capture Agents</h3>
        {!isAdding && (
          <button className="add-agent-btn" onClick={() => setIsAdding(true)}>
            + Add Agent
          </button>
        )}
      </div>

      {isAdding && (
        <div className="add-agent-form">
          <input
            type="text"
            placeholder="Agent URL (e.g., http://localhost:8090)"
            value={agentUrl}
            onChange={(e) => setAgentUrl(e.target.value)}
            className="agent-input"
          />
          <input
            type="text"
            placeholder="Channel ID (e.g., field1)"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="agent-input"
            list="channel-options"
          />
          <datalist id="channel-options">
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </datalist>
          <div className="form-buttons">
            <button className="btn-primary" onClick={handleAdd}>
              Add
            </button>
            <button className="btn-secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="agent-list">
        {captureAgents.length === 0 ? (
          <p className="no-agents">No capture agents configured</p>
        ) : (
          captureAgents.map((agent) => (
            <div key={agent.id} className="agent-item">
              <span className={`agent-status ${agent.status}`}>●</span>
              <span className="agent-channel">{agent.channelId}</span>
              <span className="agent-url">{agent.url}</span>
              <button
                className="remove-agent-btn"
                onClick={() => removeCaptureAgent(agent.id)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

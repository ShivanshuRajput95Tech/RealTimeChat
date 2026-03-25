import React, { useContext, useEffect, useState, useCallback, useRef } from 'react'
import { AIContext } from '../context/AIContext'
import { WorkspaceContext } from '../context/WorkspaceContext'

const ConversationCanvas = ({ onClose }) => {
  const { getConversationCanvas, canvasData, isLoading } = useContext(AIContext)
  const { selectedWorkspace } = useContext(WorkspaceContext)
  const [selectedNode, setSelectedNode] = useState(null)
  const [view, setView] = useState('graph')
  const svgRef = useRef(null)

  useEffect(() => {
    getConversationCanvas(selectedWorkspace?._id)
  }, [selectedWorkspace])

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node)
  }, [])

  const NodeGraph = ({ nodes, edges }) => {
    if (!nodes || nodes.length === 0) return null
    const width = 500
    const height = 350
    const cx = width / 2
    const cy = height / 2

    const positionedNodes = nodes.map((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2
      const radius = Math.min(width, height) * 0.35
      return {
        ...node,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      }
    })

    const nodeMap = {}
    positionedNodes.forEach(n => { nodeMap[n.id] = n })

    return (
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
          </radialGradient>
        </defs>

        {edges.map((edge, i) => {
          const source = nodeMap[edge.source]
          const target = nodeMap[edge.target]
          if (!source || !target) return null
          return (
            <line
              key={i}
              x1={source.x} y1={source.y}
              x2={target.x} y2={target.y}
              stroke="rgba(99, 102, 241, 0.15)"
              strokeWidth={Math.min(edge.weight, 4)}
              strokeDasharray="4 2"
            />
          )
        })}

        {positionedNodes.map((node, i) => (
          <g
            key={node.id}
            onClick={() => handleNodeClick(node)}
            className="cursor-pointer"
          >
            <circle
              cx={node.x} cy={node.y}
              r={node.size * 3 + 8}
              fill="url(#nodeGlow)"
              className="transition-all duration-300"
            />
            <circle
              cx={node.x} cy={node.y}
              r={node.size * 2 + 4}
              fill={selectedNode?.id === node.id ? '#6366f1' : '#1c1c28'}
              stroke={selectedNode?.id === node.id ? '#818cf8' : 'rgba(99, 102, 241, 0.3)'}
              strokeWidth="2"
              className="transition-all duration-300 hover:stroke-primary"
            />
            <text
              x={node.x} y={node.y + node.size * 2 + 20}
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="10"
              fontWeight="500"
            >
              #{node.label}
            </text>
            <text
              x={node.x} y={node.y + 4}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="700"
            >
              {node.messageCount}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  return (
    <div className="h-full flex flex-col bg-surface-800/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="21.17" y1="8" x2="12" y2="8" />
              <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
              <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Conversation Canvas</h3>
            <p className="text-[10px] text-zinc-500">Visual topic map</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setView(view === 'graph' ? 'topics' : 'graph')}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-surface-700/50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5 font-medium"
          >
            {view === 'graph' ? 'Topics' : 'Graph'}
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-700/60 cursor-pointer transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-zinc-500">Mapping conversations...</p>
          </div>
        )}

        {!isLoading && canvasData && view === 'graph' && (
          <div className="space-y-4 fade-in">
            <div className="bg-surface-700/30 rounded-2xl p-4 border border-white/[0.04]">
              <NodeGraph nodes={canvasData.nodes} edges={canvasData.edges} />
            </div>

            {selectedNode && (
              <div className="bg-surface-700/50 rounded-2xl p-4 border border-primary/20 scale-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    #{selectedNode.label?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">#{selectedNode.label}</p>
                    <p className="text-[10px] text-zinc-500">{selectedNode.messageCount} messages from {selectedNode.activeUsers} users</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center text-[10px] text-zinc-600">
              {canvasData.messageCount} messages analyzed across {canvasData.nodes.length} channels
            </div>
          </div>
        )}

        {!isLoading && canvasData && view === 'topics' && (
          <div className="space-y-3 fade-in">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">AI-Detected Topics</p>
            {canvasData.topics && canvasData.topics.length > 0 ? (
              canvasData.topics.map((topic, i) => (
                <div key={i} className="bg-surface-700/50 rounded-2xl p-4 border border-white/[0.04] hover:border-primary/20 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold text-sm group-hover:text-primary transition-colors">{topic.topic}</h4>
                    <span className="text-xs text-zinc-500 bg-surface-600/50 px-2 py-1 rounded-lg font-mono">{topic.messageCount || '~'} msgs</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.keywords?.map((kw, j) => (
                      <span key={j} className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-lg font-medium">{kw}</span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-zinc-600">Not enough data for topic analysis</p>
              </div>
            )}
          </div>
        )}

        {!isLoading && !canvasData && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 mx-auto mb-4 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
              </svg>
            </div>
            <p className="text-sm text-zinc-400 mb-2">No canvas data yet</p>
            <button
              onClick={() => getConversationCanvas(selectedWorkspace?._id)}
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-semibold rounded-xl cursor-pointer hover:shadow-lg hover:shadow-violet-500/20 transition-all"
            >
              Generate Canvas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationCanvas

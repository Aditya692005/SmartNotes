"use client"

import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'

interface MindmapData {
  mainTopic: string
  subtopics: Array<{
    topic: string
    details: string[]
  }>
}

interface MindmapVisualizerProps {
  data: MindmapData | null
  isLoading?: boolean
}

export function MindmapVisualizer({ data, isLoading }: MindmapVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Convert mindmap data to React Flow nodes and edges
  const flowData = useMemo(() => {
    if (!data) return { nodes: [], edges: [] }

    const nodes: Node[] = []
    const edges: Edge[] = []

    // Create main topic node
    const mainNode: Node = {
      id: 'main',
      type: 'default',
      position: { x: 250, y: 50 },
      data: { 
        label: (
          <div className="text-center">
            <div className="font-bold text-lg text-blue-600">{data.mainTopic}</div>
          </div>
        )
      },
      style: {
        background: '#e1f5fe',
        border: '2px solid #2196f3',
        borderRadius: '10px',
        padding: '10px',
        minWidth: '200px',
      },
    }
    nodes.push(mainNode)

    // Create subtopic nodes
    data.subtopics.forEach((subtopic, index) => {
      const subtopicId = `subtopic-${index}`
      const angle = (index * 2 * Math.PI) / data.subtopics.length
      const radius = 200
      const x = 250 + radius * Math.cos(angle)
      const y = 150 + radius * Math.sin(angle)

      const subtopicNode: Node = {
        id: subtopicId,
        type: 'default',
        position: { x, y },
        data: { 
          label: (
            <div className="text-center">
              <div className="font-semibold text-md text-green-600">{subtopic.topic}</div>
            </div>
          )
        },
        style: {
          background: '#f3e5f5',
          border: '2px solid #9c27b0',
          borderRadius: '8px',
          padding: '8px',
          minWidth: '150px',
        },
      }
      nodes.push(subtopicNode)

      // Create edge from main to subtopic
      edges.push({
        id: `main-${subtopicId}`,
        source: 'main',
        target: subtopicId,
        type: 'smoothstep',
        style: { stroke: '#666', strokeWidth: 2 },
        animated: true,
      })

      // Create detail nodes for each subtopic
      subtopic.details.forEach((detail, detailIndex) => {
        const detailId = `${subtopicId}-detail-${detailIndex}`
        const detailAngle = (detailIndex * 2 * Math.PI) / subtopic.details.length
        const detailRadius = 100
        const detailX = x + detailRadius * Math.cos(detailAngle)
        const detailY = y + 100 + detailRadius * Math.sin(detailAngle)

        const detailNode: Node = {
          id: detailId,
          type: 'default',
          position: { x: detailX, y: detailY },
          data: { 
            label: (
              <div className="text-center">
                <div className="text-sm text-gray-700">{detail}</div>
              </div>
            )
          },
          style: {
            background: '#fff3e0',
            border: '1px solid #ff9800',
            borderRadius: '6px',
            padding: '6px',
            minWidth: '120px',
            fontSize: '12px',
          },
        }
        nodes.push(detailNode)

        // Create edge from subtopic to detail
        edges.push({
          id: `${subtopicId}-${detailId}`,
          source: subtopicId,
          target: detailId,
          type: 'smoothstep',
          style: { stroke: '#999', strokeWidth: 1 },
        })
      })
    })

    return { nodes, edges }
  }, [data])

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(flowData.nodes)
    setEdges(flowData.edges)
  }, [flowData, setNodes, setEdges])

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating mindmap...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full h-96 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🧠</div>
          <p>Mindmap will be generated here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}

// Transform API response data to the format expected by MindmapVisualizer
interface APIMindmapData {
  central: string
  branches: Array<{
    title: string
    subtopics: string[]
  }>
}

export function MindmapFlow({ data }: { data: any }) {
  // If data is a string, try to parse it
  let parsedData: APIMindmapData | null = null
  
  if (!data) {
    return <MindmapVisualizer data={null} />
  }

  try {
    if (typeof data === 'string') {
      parsedData = JSON.parse(data)
    } else {
      parsedData = data
    }
  } catch (error) {
    console.error("Error parsing mindmap data:", error)
    return <MindmapVisualizer data={null} />
  }

  // Transform API format to component format
  const transformedData = {
    mainTopic: parsedData.central || "Main Topic",
    subtopics: parsedData.branches?.map(branch => ({
      topic: branch.title || "Untitled",
      details: Array.isArray(branch.subtopics) ? branch.subtopics : []
    })) || []
  }

  return <MindmapVisualizer data={transformedData} />
}

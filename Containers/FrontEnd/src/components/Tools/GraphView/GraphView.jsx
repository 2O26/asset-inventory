import { GetState } from '../../Services/ApiService.js'
import { useQuery } from '@tanstack/react-query';
import jsonData from './mock.json';
import ELK from 'elkjs/lib/elk.bundled.js';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    Panel,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    useReactFlow
} from 'reactflow';

import 'reactflow/dist/style.css';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner.jsx';
import { ParseState } from './ParseState.jsx';
import { useNavigate } from 'react-router-dom';
import './GraphView.css'
import { CustomNodeComponent } from './CustomNode.jsx';


const elk = new ELK();

// Elk has a *huge* amount of options to configure. To see everything you can
// tweak check out:
//
// - https://www.eclipse.org/elk/reference/algorithms.html
// - https://www.eclipse.org/elk/reference/options.html
const elkOptions = {
    'elk.algorithm': 'layered',
    'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    'elk.spacing.nodeNode': '80',
};

const getLayoutedElements = (nodes, edges, options = {}) => {
    const isHorizontal = options?.['elk.direction'] === 'RIGHT';
    const graph = {
        id: 'root',
        layoutOptions: options,
        children: nodes.map((node) => ({
            ...node,
            // Adjust the target and source handle positions based on the layout
            // direction.
            targetPosition: isHorizontal ? 'left' : 'top',
            sourcePosition: isHorizontal ? 'right' : 'bottom',

            // Hardcode a width and height for elk to use when layouting.
            width: 150,
            height: 50,
        })),
        edges: edges,
    };

    return elk
        .layout(graph)
        .then((layoutedGraph) => ({
            nodes: layoutedGraph.children.map((node) => ({
                ...node,
                position: { x: node.x, y: node.y }
            })),

            edges: layoutedGraph.edges,
        }))
        .catch(console.error);
};

const nodeTypes = {
    turbo: CustomNodeComponent
};

const defaultEdgeOptions = {
    markerEnd: 'edge-circle',
};

function LayoutFlow({ initialNodes, initialEdges }) {
    const navigate = useNavigate()
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    const onNodeClick = (event, node) => {
        console.log(node.data.type);
        navigate(`/asset-view/${node.id}`);
    };

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
    const onLayout = useCallback(
        ({ direction, useInitialNodes = false }) => {
            const opts = { 'elk.direction': direction, ...elkOptions };
            const ns = useInitialNodes ? initialNodes : nodes;
            const es = useInitialNodes ? initialEdges : edges;

            getLayoutedElements(ns, es, opts).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
                setNodes(layoutedNodes);
                setEdges(layoutedEdges);

                window.requestAnimationFrame(() => fitView());
            });
        },
        [nodes, edges]
    );

    // Calculate the initial layout on mount.
    useLayoutEffect(() => {
        onLayout({ direction: 'RIGHT', useInitialNodes: true });
    }, []);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            // edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
        >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
            <Panel position="top-right">
                <button onClick={() => onLayout({ direction: 'DOWN' })}>vertical layout</button>

                <button onClick={() => onLayout({ direction: 'RIGHT' })}>horizontal layout</button>
            </Panel>
            <svg>
                <defs>
                    <linearGradient id="edge-gradient">
                        <stop offset="0%" stopColor="#a8c7ea" />
                        {/* <stop offset="0%" stopColor="#ae53ba" /> */}
                        <stop offset="100%" stopColor="#2a8af6" />
                    </linearGradient>

                    <marker
                        id="edge-circle"
                        viewBox="-5 -5 10 10"
                        refX="0"
                        refY="0"
                        markerUnits="strokeWidth"
                        markerWidth="10"
                        markerHeight="10"
                        orient="auto"
                    >
                        <circle stroke="#2a8af6" fill='var(--main-color)' strokeOpacity="0.75" r="2" cx="0" cy="0" />
                    </marker>
                </defs>
            </svg>
        </ReactFlow>
    );
}

export default function GraphView() {
    // const { data, isLoading, isError, error } = useQuery({
    //     queryKey: ['getState'],
    //     queryFn: GetState,
    //     enabled: true
    // });

    // if (isLoading) return <LoadingSpinner />;
    // if (isError) return <div className='errorMessage'>{error.message}</div>;

    // const parsedState = ParseState(data);
    const parsedState = ParseState(jsonData);

    return (
        <div style={{ width: '100vw', height: '90vh' }}>
            <ReactFlowProvider>
                <LayoutFlow initialNodes={parsedState.nodes} initialEdges={parsedState.edges} />
            </ReactFlowProvider>
        </div>

    )
};

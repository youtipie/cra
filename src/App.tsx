import React, {useCallback, useRef} from 'react';
import {Background, Controls, ReactFlow, ReactFlowProvider, useReactFlow} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {useStore} from './store/useStore';
import {Palette} from './components/Palette';
import {Inspector} from './components/Inspector';
import {AnalysisBar} from './components/AnalysisBar';
import CustomNode from './components/CustomNode';
import type {AppNode, NodeType} from './types';
import {ZoneBackground} from './components/ZoneBackground';
import {useKeyboardShortcuts} from './hooks/useKeyboardShortcuts';

const nodeTypes = {
    custom: CustomNode,
};

const Flow = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const {screenToFlowPosition} = useReactFlow();

    useKeyboardShortcuts();

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        selectNode,
        toggleNodeLife,
        mode,
        takeSnapshot
    } = useStore();

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow') as NodeType;
            if (!type) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            addNode(type, position);
        },
        [screenToFlowPosition, addNode]
    );

    const onNodeClick = (_: React.MouseEvent, node: AppNode) => {
        if (mode === 'chaos') {
            toggleNodeLife(node.id);
        } else {
            selectNode(node.id);
        }
    };

    const onPaneClick = () => {
        selectNode(null);
    };

    const onNodeDragStart = () => {
        takeSnapshot();
    };

    return (
        <div className="flex flex-col h-screen bg-canvas overflow-hidden">
            <AnalysisBar/>

            <div className="flex flex-1 overflow-hidden">
                <Palette/>

                <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        onNodeDragStart={onNodeDragStart}
                        fitView
                        deleteKeyCode={null}
                    >
                        <ZoneBackground/>
                        <Background color="#cbd5e1" gap={20}/>
                        <Controls/>
                    </ReactFlow>
                </div>

                <Inspector/>
            </div>

            <ToastContainer position="bottom-right" theme="colored"/>
        </div>
    );
};

export default function App() {
    return (
        <ReactFlowProvider>
            <Flow/>
        </ReactFlowProvider>
    );
}
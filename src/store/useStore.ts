import {create} from 'zustand';
import {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    type Connection,
    type EdgeChange,
    type NodeChange,
    type OnConnect,
    type OnEdgesChange,
    type OnNodesChange,
} from '@xyflow/react';
import type {AnalysisResult, AppEdge, AppNode, AvailabilityZone, NodeType} from '../types';
import {validateConnection} from '../utils/validation';
import {NODE_CONFIGS} from '../utils/constants';
import {v4 as uuidv4} from 'uuid';
import {toast} from 'react-toastify';

interface HistoryEntry {
    nodes: AppNode[];
    edges: AppEdge[];
}

interface AppState {
    nodes: AppNode[];
    edges: AppEdge[];
    selectedNodeId: string | null;
    mode: 'design' | 'chaos';
    analysisResult: AnalysisResult | null;
    past: HistoryEntry[];
    future: HistoryEntry[];

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (type: NodeType, position: { x: number; y: number }) => void;
    updateNodeData: (id: string, data: Partial<AppNode['data']>) => void;
    deleteNode: (id: string) => void;
    selectNode: (id: string | null) => void;
    toggleChaosMode: () => void;
    toggleNodeLife: (id: string) => void;
    runAnalysis: () => Promise<void>;
    clearCanvas: () => void;
    loadGraph: (data: { nodes: AppNode[], edges: AppEdge[] }) => void;
    undo: () => void;
    redo: () => void;
    takeSnapshot: () => void;
}

const mockAnalyze = async (nodes: AppNode[], edges: AppEdge[]): Promise<AnalysisResult> => {
    console.log("MOCK:", nodes, edges);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                stability_score: Math.floor(Math.random() * 40) + 60,
                critical_nodes: nodes.length > 0 ? [nodes[0].id] : [],
            });
        }, 800);
    });
};

export const useStore = create<AppState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    mode: 'design',
    analysisResult: null,
    past: [],
    future: [],

    takeSnapshot: () => {
        set((state) => ({
            past: [...state.past, {nodes: state.nodes, edges: state.edges}],
            future: [],
        }));
    },

    undo: () => {
        set((state) => {
            if (state.past.length === 0) return state;
            const previous = state.past[state.past.length - 1];
            const newPast = state.past.slice(0, -1);
            toast.dismiss();
            toast.info("Undo", {autoClose: 1000, hideProgressBar: true});
            return {
                past: newPast,
                future: [{nodes: state.nodes, edges: state.edges}, ...state.future],
                nodes: previous.nodes,
                edges: previous.edges,
                analysisResult: null,
            };
        });
    },

    redo: () => {
        set((state) => {
            if (state.future.length === 0) return state;
            const next = state.future[0];
            const newFuture = state.future.slice(1);
            toast.dismiss();
            toast.info("Redo", {autoClose: 1000, hideProgressBar: true});
            return {
                past: [...state.past, {nodes: state.nodes, edges: state.edges}],
                future: newFuture,
                nodes: next.nodes,
                edges: next.edges,
                analysisResult: null,
            };
        });
    },

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        const validation = validateConnection(connection, get().nodes);

        if (validation.valid) {
            get().takeSnapshot();
            set({
                edges: addEdge(connection, get().edges),
            });
        } else {
            toast.error(validation.reason || "Invalid connection", {autoClose: 2000, hideProgressBar: true});
        }
    },

    addNode: (type, position) => {
        get().takeSnapshot();
        const config = NODE_CONFIGS[type];

        let defaultAz: AvailabilityZone = 'eu-west-1a';
        if (config.isGlobal) defaultAz = 'global';
        else if (config.isRegional) defaultAz = 'regional';

        let defaultStandby: AvailabilityZone | undefined = undefined;
        if (type === 'RDS' || type === 'ElastiCache') {
            defaultStandby = 'eu-west-1b';
        }

        const newNode: AppNode = {
            id: uuidv4(),
            type: 'custom',
            position,
            data: {
                label: type,
                type,
                az: defaultAz,
                standbyAz: defaultStandby,
                isDead: false,
                multiAz: false,
                s3AccessType: type === 'S3' ? 'Gateway' : undefined,
                queueType: type === 'SQS' ? 'Standard' : undefined,
                priceClass: type === 'CloudFront' ? 'PriceClass_100' : undefined,
                apiType: type === 'APIGW' ? 'REST' : undefined,
                endpointType: type === 'APIGW' ? 'Regional' : undefined,
            },
        };
        set({nodes: [...get().nodes, newNode]});
    },

    updateNodeData: (id, data) => {
        get().takeSnapshot();

        set((state) => {
            const nodes = state.nodes.map((node) => {
                if (node.id === id) {
                    const mergedData = {...node.data, ...data};

                    if (node.data.type === 'S3' && data.s3AccessType === 'Interface' && node.data.az === 'regional') {
                        mergedData.az = 'eu-west-1a';
                        toast.info("S3 Interface endpoint requires a specific Zone. Defaulted to eu-west-1a.", {
                            autoClose: 3000,
                            hideProgressBar: true
                        });
                    }
                    if (node.data.type === 'S3' && data.s3AccessType === 'Gateway') {
                        mergedData.az = 'regional';
                    }

                    if ((mergedData.type === 'RDS' || mergedData.type === 'ElastiCache') && mergedData.multiAz) {
                        if (mergedData.az === mergedData.standbyAz) {
                            mergedData.standbyAz = mergedData.az === 'eu-west-1a' ? 'eu-west-1b' : 'eu-west-1a';
                            toast.info("Standby AZ cannot be the same as Primary AZ. Auto-adjusted.", {
                                autoClose: 3000,
                                hideProgressBar: true
                            });
                        }
                    }

                    return {...node, data: mergedData};
                }
                return node;
            });
            return {nodes};
        });

        if (data.publicIp === false) {
            let edgesRemoved = false;
            set((state) => {
                const newEdges = state.edges.filter(edge => {
                    const isConnectedToIGW = state.nodes.find(n => (n.id === edge.source || n.id === edge.target) && n.data.type === 'IGW');
                    const isTarget = edge.target === id;
                    if (isConnectedToIGW && isTarget) {
                        edgesRemoved = true;
                        return false;
                    }
                    return true;
                });
                return {edges: newEdges};
            });
            if (edgesRemoved) {
                toast.warning("Public IP disabled: Connection to Internet Gateway removed.", {
                    autoClose: 3000,
                    hideProgressBar: true
                });
            }
        }
    },

    deleteNode: (id) => {
        get().takeSnapshot();
        set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== id),
            edges: state.edges.filter((e) => e.source !== id && e.target !== id),
            selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        }));
        toast.info("Node deleted", {autoClose: 1000, hideProgressBar: true});
    },

    selectNode: (id) => set({selectedNodeId: id}),

    toggleChaosMode: () => set((state) => {
        const newMode = state.mode === 'design' ? 'chaos' : 'design';
        let updatedNodes = state.nodes;

        if (newMode === 'design') {
            updatedNodes = state.nodes.map((n) => ({
                ...n,
                data: {...n.data, isDead: false, isCritical: false},
            }));
            toast.success("Chaos simulation ended. Nodes reset.", {autoClose: 2000, hideProgressBar: true});
        } else {
            toast.warn("Chaos Mode Active: Click nodes to kill them!", {autoClose: 2000, hideProgressBar: true});
        }

        return {
            mode: newMode,
            nodes: updatedNodes,
            analysisResult: newMode === 'design' ? null : state.analysisResult
        };
    }),

    toggleNodeLife: (id) => {
        const {mode, runAnalysis} = get();
        if (mode !== 'chaos') return;
        get().takeSnapshot();

        set((state) => ({
            nodes: state.nodes.map((n) =>
                n.id === id ? {...n, data: {...n.data, isDead: !n.data.isDead}} : n
            ),
        }));

        runAnalysis();
    },

    runAnalysis: async () => {
        const {nodes, edges} = get();
        const ZONES: AvailabilityZone[] = ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'];

        const toastId = toast.loading("Analyzing Architecture...", {hideProgressBar: true});

        const expansionMap: Record<string, AppNode[]> = {};

        nodes.forEach(node => {
            const data = node.data;
            const expandedNodes: AppNode[] = [];

            if (data.type === 'NAT' && (data.count && data.count > 1)) {
                for (let i = 0; i < data.count; i++) {
                    expandedNodes.push({
                        ...node,
                        id: `${node.id}-instance-${i + 1}`,
                        data: {
                            ...data,
                            label: `${data.label} ${i + 1}`,
                            az: ZONES[i % ZONES.length],
                        }
                    });
                }
            } else if (data.type === 'ASG' && (data.minSize && data.minSize > 1)) {
                for (let i = 0; i < data.minSize; i++) {
                    expandedNodes.push({
                        ...node,
                        id: `${node.id}-instance-${i + 1}`,
                        data: {
                            ...data,
                            label: `${data.label} ${i + 1}`,
                            az: ZONES[i % ZONES.length],
                        }
                    });
                }
            } else if ((data.type === 'RDS' || data.type === 'ElastiCache') && data.multiAz) {
                expandedNodes.push({
                    ...node,
                    id: `${node.id}-primary`,
                    data: {...data, label: `${data.label} (Primary)`, az: data.az}
                });
                expandedNodes.push({
                    ...node,
                    id: `${node.id}-standby`,
                    data: {...data, label: `${data.label} (Standby)`, az: data.standbyAz || 'eu-west-1b'}
                });
            } else {
                expandedNodes.push(node);
            }
            expansionMap[node.id] = expandedNodes;
        });

        const physicalNodes = Object.values(expansionMap).flat();

        const physicalEdges: AppEdge[] = [];
        edges.forEach(edge => {
            const sourcePhysicals = expansionMap[edge.source] || [];
            const targetPhysicals = expansionMap[edge.target] || [];
            sourcePhysicals.forEach(src => {
                targetPhysicals.forEach(tgt => {
                    physicalEdges.push({
                        ...edge,
                        id: `${edge.id}-${src.id}-${tgt.id}`,
                        source: src.id,
                        target: tgt.id
                    });
                });
            });
        });

        const exportNodes = physicalNodes.map(node => {
            const {
                multiAz,
                standbyAz,
                minSize,
                maxSize,
                publicIp,
                az,
                ...rest
            } = node.data;

            const properties: Record<string, unknown> = {
                ...rest,
                primary_az: az,
                az: az,
            };

            if (multiAz !== undefined) properties.multi_az = multiAz;
            if (standbyAz !== undefined) properties.standby_az = standbyAz;
            if (minSize !== undefined) properties.min_size = minSize;
            if (maxSize !== undefined) properties.max_size = maxSize;
            if (publicIp !== undefined) properties.public_ip = publicIp;

            return {
                id: node.id,
                type: node.type === 'custom' ? node.data.type : node.type,
                properties
            };
        });

        const exportEdgesPayload = physicalEdges.map(edge => ({
            source: edge.source,
            target: edge.target
        }));

        const payload = {
            nodes: exportNodes,
            edges: exportEdgesPayload
        };

        console.log("Analyzing Payload (Physical Graph Expansion):", JSON.stringify(payload, null, 2));

        const result = await mockAnalyze(physicalNodes, physicalEdges);

        const logicalCriticalIds = new Set<string>();
        result.critical_nodes.forEach(critId => {
            for (const [logicalId, physNodes] of Object.entries(expansionMap)) {
                if (physNodes.some(p => p.id === critId)) {
                    logicalCriticalIds.add(logicalId);
                    break;
                }
            }
        });

        set({analysisResult: result});
        set((state) => ({
            nodes: state.nodes.map((n) => ({
                ...n,
                data: {
                    ...n.data,
                    isCritical: logicalCriticalIds.has(n.id),
                },
            })),
        }));

        toast.update(toastId, {
            render: `Analysis Complete. Score: ${result.stability_score}/100`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
            hideProgressBar: true
        });
    },

    clearCanvas: () => {
        get().takeSnapshot();
        set({nodes: [], edges: [], analysisResult: null});
        toast.info("Canvas Cleared", {autoClose: 1000, hideProgressBar: true});
    },

    loadGraph: ({nodes, edges}) => {
        set({nodes, edges, analysisResult: null, selectedNodeId: null, past: [], future: []});
        toast.success("Graph loaded successfully", {autoClose: 2000, hideProgressBar: true});
    },
}));
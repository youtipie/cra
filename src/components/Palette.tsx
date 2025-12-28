import React from 'react';
import {NODE_CONFIGS} from '../utils/constants';
import type {NodeType} from '../types';
import {Activity, Cloud, Database, Globe, HardDrive, Layers, Lock, Network, Server, Wifi} from 'lucide-react';

const Icons: Record<NodeType, React.ElementType> = {
    EC2: Server,
    ASG: Layers,
    Lambda: Activity,
    RDS: Database,
    ElastiCache: Database,
    NAT: Network,
    ALB: Network,
    APIGW: Globe,
    TGW: Wifi,
    VGW: Lock,
    SQS: HardDrive,
    S3: HardDrive,
    CloudFront: Cloud,
    IGW: Cloud,
};

export const Palette = () => {
    const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside
            className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10">
            <div className="p-4 border-b border-gray-200 bg-slate-50/50">
                <h2 className="font-semibold text-slate-800">Components</h2>
                <p className="text-xs text-slate-500">Drag to canvas</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {Object.entries(NODE_CONFIGS).map(([type, config]) => {
                    const Icon = Icons[type as NodeType] || Server;

                    return (
                        <div
                            key={type}
                            className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-md cursor-grab hover:bg-slate-50 hover:border-blue-300 hover:shadow-sm transition-all group"
                            draggable
                            onDragStart={(e) => onDragStart(e, type as NodeType)}
                        >
                            <div
                                className="p-2 bg-slate-50 rounded text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                <Icon className="w-5 h-5"/>
                            </div>
                            <div
                                className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{config.label}</div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};
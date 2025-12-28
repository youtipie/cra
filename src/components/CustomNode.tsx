import React, {memo} from 'react';
import {Handle, type NodeProps, Position} from '@xyflow/react';
import clsx from 'clsx';
import {Activity, Cloud, Database, Globe, HardDrive, Layers, Lock, Network, Server, Wifi} from 'lucide-react';
import type {AppNode, NodeType} from '../types';

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

const CustomNode = ({data, selected}: NodeProps<AppNode>) => {
    const Icon = Icons[data.type] || Server;

    const isDead = data.isDead;
    const isCritical = data.isCritical;

    const isCluster = (data.minSize && data.minSize > 1) || (data.count && (data.count as number) > 1);
    const showGlobe = data.publicIp;
    const isMultiAz = data.multiAz;

    return (
        <div
            className={clsx(
                "relative flex flex-col items-center justify-center p-2 rounded-md border-2 min-w-[80px] bg-white transition-all shadow-sm",
                selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200",
                isCritical && "border-red-500 animate-pulse ring-2 ring-red-200",
                isDead && "opacity-50 grayscale bg-gray-100",
            )}
        >
            <Handle type="target" position={Position.Top} className="!bg-gray-400"/>
            <Handle type="source" position={Position.Bottom} className="!bg-gray-400"/>

            <div className="relative">
                <Icon className={clsx("w-8 h-8 text-slate-700", isDead && "text-gray-400")}/>

                {showGlobe && (
                    <div className="absolute -top-2 -right-2 bg-blue-100 p-0.5 rounded-full border border-blue-200"
                         title="Public IP">
                        <Globe className="w-3 h-3 text-blue-600"/>
                    </div>
                )}

                {isCluster && (
                    <div
                        className="absolute -bottom-1 -right-2 bg-slate-100 p-0.5 rounded shadow-sm border border-slate-300"
                        title="Cluster/Multi-Instance">
                        <Layers className="w-3 h-3 text-slate-600"/>
                    </div>
                )}

                {isMultiAz && (
                    <div
                        className="absolute bottom-0 -left-2 bg-purple-100 p-0.5 rounded-full border border-purple-200 shadow-sm flex items-center justify-center"
                        title={`Multi-AZ Active (Standby: ${data.standbyAz})`}
                    >
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-0.5"/>
                        <div className="w-1.5 h-1.5 bg-purple-300 rounded-full"/>
                    </div>
                )}
            </div>

            <span className="mt-1 text-xs font-medium text-gray-600 max-w-[100px] truncate text-center">
        {data.label}
      </span>

            <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase leading-tight">{data.az}</span>
                {isMultiAz && data.standbyAz && (
                    <span className="text-[8px] text-purple-400 uppercase leading-tight">+ {data.standbyAz}</span>
                )}
            </div>

            {isDead && (
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-md overflow-hidden">
                    <div className="absolute inset-0 bg-white/20"/>
                    <div className="w-full h-0.5 bg-red-500/80 rotate-45 absolute"/>
                    <div className="w-full h-0.5 bg-red-500/80 -rotate-45 absolute"/>
                </div>
            )}
        </div>
    );
};

export default memo(CustomNode);
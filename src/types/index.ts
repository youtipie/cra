import type {Edge, Node} from '@xyflow/react';

export type AvailabilityZone = 'eu-west-1a' | 'eu-west-1b' | 'eu-west-1c' | 'global' | 'regional';

export type NodeType =
    | 'EC2' | 'ASG' | 'Lambda' | 'RDS' | 'ElastiCache'
    | 'NAT' | 'ALB' | 'APIGW' | 'TGW' | 'VGW'
    | 'SQS' | 'S3' | 'CloudFront' | 'IGW';

export interface NodeData extends Record<string, unknown> {
    label: string;
    type: NodeType;
    az: AvailabilityZone;

    publicIp?: boolean;
    minSize?: number;
    maxSize?: number;
    multiAz?: boolean;
    standbyAz?: AvailabilityZone;
    engine?: 'pg' | 'mysql' | 'redis' | 'memcached';

    s3AccessType?: 'Gateway' | 'Interface';

    priceClass?: 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All';

    apiType?: 'REST' | 'HTTP';
    endpointType?: 'Regional' | 'Private';

    queueType?: 'Standard' | 'FIFO';

    isDead?: boolean;
    isCritical?: boolean;
    count?: number;
}

export type AppNode = Node<NodeData, 'custom'>;
export type AppEdge = Edge;

export interface AnalysisResult {
    stability_score: number;
    critical_nodes: string[];
}
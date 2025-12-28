import type {Connection, Edge} from '@xyflow/react';
import type {AppNode} from '../types';
import {CONNECTION_MATRIX} from './constants';

export const validateConnection = (
    connection: Connection | Edge,
    nodes: AppNode[]
): { valid: boolean; reason?: string } => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return {valid: false, reason: "Node not found"};

    const sourceType = sourceNode.data.type;
    const targetType = targetNode.data.type;

    const allowedTargets = CONNECTION_MATRIX[sourceType] || [];
    if (!allowedTargets.includes(targetType)) {
        return {
            valid: false,
            reason: `Connection forbidden: ${sourceType} cannot connect to ${targetType}`
        };
    }

    if (sourceType === 'IGW' && targetType === 'EC2') {
        if (!targetNode.data.publicIp) {
            return {
                valid: false,
                reason: "Connection blocked: EC2 must have Public IP enabled to connect to Internet Gateway"
            };
        }
    }

    return {valid: true};
};

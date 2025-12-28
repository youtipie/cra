import type {AvailabilityZone, NodeType} from '../types';

export const REGION = 'eu-west-1';
export const ZONES: AvailabilityZone[] = ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'];

export const NODE_CONFIGS: Record<NodeType, { label: string; isRegional?: boolean; isGlobal?: boolean }> = {
    EC2: {label: 'EC2 Instance'},
    ASG: {label: 'Auto Scaling Group'},
    Lambda: {label: 'Lambda Function'},
    RDS: {label: 'RDS Database'},
    ElastiCache: {label: 'ElastiCache'},
    NAT: {label: 'NAT Gateway'},
    ALB: {label: 'Load Balancer'},

    APIGW: {label: 'API Gateway', isRegional: true},
    TGW: {label: 'Transit Gateway', isRegional: true},
    VGW: {label: 'VPN Gateway', isRegional: true},
    SQS: {label: 'SQS Queue', isRegional: true},
    S3: {label: 'S3 Bucket', isRegional: true},
    IGW: {label: 'Internet Gateway', isRegional: true},

    CloudFront: {label: 'CloudFront', isGlobal: true},
};

export const CONNECTION_MATRIX: Record<NodeType, NodeType[]> = {
    IGW: ['ALB', 'NAT', 'APIGW', 'EC2'],
    CloudFront: ['ALB', 'S3', 'APIGW'],
    ALB: ['EC2', 'ASG', 'Lambda'],
    APIGW: ['Lambda', 'ALB', 'EC2', 'ASG', 'SQS'],
    NAT: ['IGW'],
    EC2: ['RDS', 'ElastiCache', 'S3', 'SQS', 'NAT', 'TGW', 'ALB', 'EC2', 'ASG', 'Lambda'],
    ASG: ['RDS', 'ElastiCache', 'S3', 'SQS', 'NAT', 'TGW', 'ALB', 'EC2', 'ASG', 'Lambda'],
    Lambda: ['RDS', 'ElastiCache', 'S3', 'SQS', 'NAT', 'TGW', 'ALB', 'EC2', 'ASG', 'Lambda'],
    TGW: ['EC2', 'ASG', 'Lambda', 'NAT', 'ALB', 'VGW'],
    VGW: ['TGW', 'EC2', 'ASG'],
    SQS: ['Lambda', 'EC2'],
    RDS: [],
    ElastiCache: [],
    S3: ['SQS', 'Lambda'],
};
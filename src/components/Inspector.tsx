import {useStore} from '../store/useStore';
import {NODE_CONFIGS, ZONES} from '../utils/constants';

export const Inspector = () => {
    const {nodes, selectedNodeId, updateNodeData, deleteNode} = useStore();
    const selectedNode = nodes.find((n) => n.id === selectedNodeId);

    if (!selectedNode) {
        return (
            <aside
                className="w-80 bg-white border-l border-gray-200 p-6 flex items-center justify-center text-gray-400 text-sm shadow-xl z-20">
                Select a node to configure
            </aside>
        );
    }

    const {data} = selectedNode;
    const config = NODE_CONFIGS[data.type];

    const handleChange = (key: string, value: string | number | boolean) => {
        updateNodeData(selectedNode.id, {[key]: value});
    };

    const isGlobal = config.isGlobal;
    const isRegional = config.isRegional;

    const showAzSelector =
        data.type === 'TGW' ||
        (data.type === 'S3' && data.s3AccessType === 'Interface') ||
        (!isGlobal && !isRegional);

    return (
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-20">
            <div className="p-4 border-b border-gray-200 bg-slate-50">
                <h2 className="font-semibold text-slate-800">Configuration</h2>
                <div className="text-xs text-slate-500 font-mono mt-1">{selectedNode.id}</div>
                <div
                    className="mt-1 text-xs px-2 py-0.5 rounded-full inline-block bg-blue-100 text-blue-700 font-medium">
                    {config.label}
                </div>
            </div>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase">Label</label>
                    <input
                        type="text"
                        value={data.label as string}
                        onChange={(e) => handleChange('label', e.target.value)}
                        className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {showAzSelector && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase">
                            {(data.multiAz) ? "Primary AZ" : "Availability Zone"}
                        </label>
                        <select
                            value={(data.az === 'regional' || data.az === 'global') ? ZONES[0] : data.az as string}
                            onChange={(e) => handleChange('az', e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm bg-white"
                        >
                            {ZONES.map((z) => (
                                <option key={z} value={z}>{z}</option>
                            ))}
                        </select>
                    </div>
                )}

                {data.type === 'EC2' && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="publicIp"
                            checked={!!data.publicIp}
                            onChange={(e) => handleChange('publicIp', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600"
                        />
                        <label htmlFor="publicIp" className="text-sm text-slate-700">Enable Public IP</label>
                    </div>
                )}

                {(data.type === 'ASG' || data.type === 'NAT') && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase">
                            {data.type === 'ASG' ? 'Min Size' : 'Count'}
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={data.type === 'ASG' ? (data.minSize as number) || 1 : (data.count as number) || 1}
                            onChange={(e) => handleChange(data.type === 'ASG' ? 'minSize' : 'count', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded text-sm"
                        />
                    </div>
                )}

                {(data.type === 'RDS' || data.type === 'ElastiCache') && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="multiAz"
                                checked={!!data.multiAz}
                                onChange={(e) => handleChange('multiAz', e.target.checked)}
                                className="rounded border-gray-300 text-purple-600"
                            />
                            <label htmlFor="multiAz" className="text-sm text-slate-700">Enable Multi-AZ</label>
                        </div>

                        {data.multiAz && (
                            <div className="space-y-1 p-3 bg-slate-50 border border-slate-200 rounded-md">
                                <label className="text-xs font-semibold text-slate-600 uppercase">Standby AZ</label>
                                <select
                                    value={data.standbyAz as string}
                                    onChange={(e) => handleChange('standbyAz', e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm bg-white"
                                >
                                    {ZONES.map((z) => (
                                        <option
                                            key={z}
                                            value={z}
                                            disabled={z === data.az}
                                            className={z === data.az ? "text-gray-300 italic" : ""}
                                        >
                                            {z} {z === data.az ? "(Primary)" : ""}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-500">
                                    Standby replica location. Must be different from Primary AZ.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {data.type === 'S3' && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase">Access Type</label>
                        <select
                            value={data.s3AccessType as string}
                            onChange={(e) => handleChange('s3AccessType', e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm bg-white"
                        >
                            <option value="Gateway">Gateway (Regional)</option>
                            <option value="Interface">Interface (Zonal)</option>
                        </select>
                        <p className="text-[10px] text-gray-500">
                            Gateway is regional. Interface requires an ENI in a specific zone.
                        </p>
                    </div>
                )}

                {data.type === 'CloudFront' && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase">Price Class</label>
                        <select
                            value={data.priceClass as string}
                            onChange={(e) => handleChange('priceClass', e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm bg-white"
                        >
                            <option value="PriceClass_100">Price Class 100</option>
                            <option value="PriceClass_200">Price Class 200</option>
                            <option value="PriceClass_All">Price Class All</option>
                        </select>
                    </div>
                )}

                {data.type === 'SQS' && (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase">Queue Type</label>
                        <select
                            value={data.queueType as string}
                            onChange={(e) => handleChange('queueType', e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm bg-white"
                        >
                            <option value="Standard">Standard</option>
                            <option value="FIFO">FIFO</option>
                        </select>
                    </div>
                )}

                {data.type === 'APIGW' && (
                    <>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase">Type</label>
                            <select
                                value={data.apiType as string}
                                onChange={(e) => handleChange('apiType', e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm bg-white"
                            >
                                <option value="REST">REST</option>
                                <option value="HTTP">HTTP</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 uppercase">Endpoint</label>
                            <select
                                value={data.endpointType as string}
                                onChange={(e) => handleChange('endpointType', e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm bg-white"
                            >
                                <option value="Regional">Regional</option>
                                <option value="Private">Private</option>
                            </select>
                        </div>
                    </>
                )}

            </div>

            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={() => deleteNode(selectedNode.id)}
                    className="w-full py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors"
                >
                    Delete Node
                </button>
            </div>
        </aside>
    );
};
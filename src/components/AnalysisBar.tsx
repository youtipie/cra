import React, {useRef} from 'react';
import {useStore} from '../store/useStore';
import {Activity, AlertTriangle, Download, Play, Redo2, Undo2, Upload} from 'lucide-react';
import type {AppEdge, AppNode} from '../types';
import {toast} from "react-toastify";

export const AnalysisBar = () => {
    const {
        runAnalysis,
        analysisResult,
        mode,
        toggleChaosMode,
        nodes,
        edges,
        loadGraph,
        undo,
        redo,
        past,
        future
    } = useStore();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result as string;
                const data = JSON.parse(result) as { nodes: AppNode[], edges: AppEdge[] };

                if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
                    loadGraph(data);
                } else {
                    alert('Invalid JSON structure: missing nodes or edges arrays.');
                }
            } catch (err) {
                console.error("Failed to parse JSON", err);
                alert('Failed to parse JSON file.');
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleExport = () => {
        const data = JSON.stringify({nodes, edges}, null, 2);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cloud-resilience-save.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Graph saved successfully", {autoClose: 2000, hideProgressBar: true});
    }

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">Cloud Resilience <span
                    className="text-blue-600">Architect</span></h1>
                <div className="h-6 w-px bg-gray-200 mx-2"/>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={undo}
                        disabled={past.length === 0}
                        className="p-1.5 hover:bg-white rounded-md text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        title="Undo"
                    >
                        <Undo2 className="w-4 h-4"/>
                    </button>
                    <button
                        onClick={redo}
                        disabled={future.length === 0}
                        className="p-1.5 hover:bg-white rounded-md text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        title="Redo"
                    >
                        <Redo2 className="w-4 h-4"/>
                    </button>
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2"/>

                <button
                    onClick={toggleChaosMode}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        mode === 'chaos'
                            ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {mode === 'chaos' ? <Activity className="w-4 h-4 animate-pulse"/> : <Play className="w-4 h-4"/>}
                    {mode === 'chaos' ? 'Chaos Mode Active' : 'Simulate Chaos'}
                </button>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 mr-2">
                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleImport}
                        className="hidden"
                    />
                    <button
                        onClick={triggerImport}
                        className="text-slate-600 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Load JSON"
                    >
                        <Upload className="w-4 h-4"/>
                        Load
                    </button>
                    <button
                        onClick={handleExport}
                        className="text-slate-600 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Save Project"
                    >
                        <Download className="w-4 h-4"/>
                        Save
                    </button>
                </div>

                {analysisResult && (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500 uppercase font-semibold">Stability Score</span>
                            <span className={`text-xl font-bold ${
                                analysisResult.stability_score > 80 ? 'text-green-600' : 'text-amber-500'
                            }`}>
                 {analysisResult.stability_score}/100
               </span>
                        </div>
                        {analysisResult.stability_score < 100 && (
                            <div
                                className="flex items-center gap-1 text-amber-600 text-sm bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                <AlertTriangle className="w-4 h-4"/>
                                <span>Critical Paths Found</span>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={runAnalysis}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium shadow-sm transition-colors flex items-center gap-2"
                >
                    <Activity className="w-4 h-4"/>
                    Run Analysis
                </button>
            </div>
        </div>
    );
};
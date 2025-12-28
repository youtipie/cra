import {useEffect} from 'react';
import {useStore} from '../store/useStore';

export const useKeyboardShortcuts = () => {
    const {undo, redo, deleteNode, selectedNodeId, takeSnapshot} = useStore();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
                return;
            }

            const isCtrlOrMeta = event.ctrlKey || event.metaKey;
            const isShift = event.shiftKey;

            if (isCtrlOrMeta && event.key.toLowerCase() === 'z' && !isShift) {
                event.preventDefault();
                undo();
                return;
            }

            if ((isCtrlOrMeta && event.key.toLowerCase() === 'y') || (isCtrlOrMeta && isShift && event.key.toLowerCase() === 'z')) {
                event.preventDefault();
                redo();
                return;
            }

            if (isCtrlOrMeta && event.key.toLowerCase() === 'x') {
                event.preventDefault();
                if (selectedNodeId) {
                    takeSnapshot();
                    deleteNode(selectedNodeId);
                }
                return;
            }

            if (event.key === 'Delete') {
                if (selectedNodeId) {
                    takeSnapshot();
                    deleteNode(selectedNodeId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, deleteNode, selectedNodeId, takeSnapshot]);
};
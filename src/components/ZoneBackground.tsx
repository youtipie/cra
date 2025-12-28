import {useMemo} from 'react';
import {useViewport} from '@xyflow/react';
import {useStore} from '../store/useStore';
import {ZONES, REGION} from '../utils/constants';

const PADDING = 60;
const TITLE_HEIGHT = 40;

export const ZoneBackground = () => {
    const {x, y, zoom} = useViewport();
    const nodes = useStore((state) => state.nodes);

    const zoneBoxes = useMemo(() => {
        const boxes: Record<string, { x: number; y: number; w: number; h: number } | null> = {};

        ZONES.forEach((zone) => {
            const zoneNodes = nodes.filter((n) => n.data.az === zone);

            if (zoneNodes.length === 0) {
                boxes[zone] = null;
                return;
            }

            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            zoneNodes.forEach((node) => {
                const w = node.measured?.width ?? 80;
                const h = node.measured?.height ?? 80;

                if (node.position.x < minX) minX = node.position.x;
                if (node.position.y < minY) minY = node.position.y;
                if (node.position.x + w > maxX) maxX = node.position.x + w;
                if (node.position.y + h > maxY) maxY = node.position.y + h;
            });

            boxes[zone] = {
                x: minX - PADDING,
                y: minY - PADDING - TITLE_HEIGHT,
                w: maxX - minX + PADDING * 2,
                h: maxY - minY + PADDING * 2 + TITLE_HEIGHT,
            };
        });

        return boxes;
    }, [nodes]);

    const regionBox = useMemo(() => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let hasContent = false;

        Object.values(zoneBoxes).forEach((box) => {
            if (box) {
                hasContent = true;
                if (box.x < minX) minX = box.x;
                if (box.y < minY) minY = box.y;
                if (box.x + box.w > maxX) maxX = box.x + box.w;
                if (box.y + box.h > maxY) maxY = box.y + box.h;
            }
        });

        if (!hasContent) return null;

        const R_PAD = 40;

        return {
            x: minX - R_PAD,
            y: minY - R_PAD - TITLE_HEIGHT,
            w: maxX - minX + R_PAD * 2,
            h: maxY - minY + R_PAD * 2 + TITLE_HEIGHT,
        };
    }, [zoneBoxes]);

    return (
        <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible origin-top-left z-0"
            style={{
                transform: `translate(${x}px, ${y}px) scale(${zoom})`,
            }}
        >
            {regionBox && (
                <div
                    className="absolute border-2 border-blue-200 bg-blue-50/10 rounded-xl transition-all duration-300"
                    style={{
                        transform: `translate(${regionBox.x}px, ${regionBox.y}px)`,
                        width: regionBox.w,
                        height: regionBox.h,
                    }}
                >
                    <div
                        className="absolute -top-4 left-4 bg-white px-2 text-xs font-bold text-blue-400 uppercase tracking-wider border border-blue-100 rounded shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Region: {REGION}
                    </div>
                </div>
            )}

            {ZONES.map((zone) => {
                const box = zoneBoxes[zone];
                if (!box) return null;

                return (
                    <div
                        key={zone}
                        className="absolute border-2 border-dashed border-slate-300 bg-slate-50/30 rounded-lg transition-all duration-300"
                        style={{
                            transform: `translate(${box.x}px, ${box.y}px)`,
                            width: box.w,
                            height: box.h,
                        }}
                    >
                        <div
                            className="absolute top-0 left-0 right-0 h-8 border-b border-dashed border-slate-300 bg-slate-100/50 flex items-center px-3 rounded-t-lg">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {zone}
              </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
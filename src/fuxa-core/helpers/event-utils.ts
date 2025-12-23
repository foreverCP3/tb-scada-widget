/**
 * V3: 事件工具类
 * 从 FUXA 复制，移除 Angular 依赖
 */

export class EventUtils {

    static getEventClientPosition(event: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } | null {
        if ('clientX' in event && 'clientY' in event) {
            return { x: event.clientX, y: event.clientY };
        } else if ('touches' in event && event.touches.length > 0) {
            return {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        } else if ('changedTouches' in event && event.changedTouches.length > 0) {
            return {
                x: event.changedTouches[0].clientX,
                y: event.changedTouches[0].clientY
            };
        }
        return null;
    }
}

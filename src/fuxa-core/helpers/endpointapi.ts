/**
 * V3: API 端点工具类
 * 从 FUXA 复制，移除 Angular 依赖
 * 注意: 在 ThingsBoard 环境中可能需要调整
 */

export class EndPointApi {
    private static url: string | null = null;

    public static getURL() {
        if (!this.url) {
            // 在 ThingsBoard Widget 环境中，可能需要从 widget context 获取
            const origin = location.origin;
            let path = location.origin.split('/')[2];
            const protocoll = location.origin.split(':')[0];
            const temp = path.split(':')[0];
            // 默认使用当前域名
            this.url = protocoll + '://' + temp;
        }
        return this.url;
    }

    public static getRemoteURL(destIp: string) {
        const protocoll = location.origin.split(':')[0];
        const path = destIp;
        return protocoll + '://' + path + '/api';
    }

    public static resolveUrl = (input?: string) => {
        if (!input) {
            return '';
        }
        try { return new URL(input, window.location.origin).toString(); }
        catch { return input.startsWith('/') ? input : '/' + input; }
    };
}

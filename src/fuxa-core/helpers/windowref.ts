/**
 * V3: 窗口引用工具类
 * 从 FUXA 复制，移除 Angular 依赖
 */

function _window(): any {
   // return the global native browser window object
   return window;
}

export class WindowRef {
   get nativeWindow(): any {
      return _window();
   }
}

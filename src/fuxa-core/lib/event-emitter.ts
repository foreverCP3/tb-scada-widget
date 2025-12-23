/**
 * V1: 事件系统 - 基于 RxJS 的封装
 * 
 * 直接使用 RxJS 库，只提供与 Angular EventEmitter 兼容的 API
 * 以及重新导出 FUXA 中常用的 RxJS 功能
 */

// ============== 从 RxJS 重新导出 ==============

// 核心类
export {
  Observable,
  Subject,
  BehaviorSubject,
  ReplaySubject,
  AsyncSubject,
  Subscription,
  Subscriber
} from 'rxjs';

// 创建函数
export {
  of,
  from,
  fromEvent,
  interval,
  timer,
  merge,
  combineLatest,
  forkJoin,
  throwError,
  EMPTY,
  NEVER
} from 'rxjs';

// 操作符
export {
  takeUntil,
  filter,
  map,
  tap,
  take,
  skip,
  distinctUntilChanged,
  debounceTime,
  throttleTime,
  delay,
  catchError,
  finalize,
  startWith,
  switchMap,
  mergeMap,
  concatMap,
  exhaustMap,
  first,
  last,
  share,
  shareReplay,
  retry,
  retryWhen,
  timeout,
  withLatestFrom,
  pairwise,
  scan,
  reduce,
  buffer,
  bufferTime,
  bufferCount,
  auditTime,
  sampleTime,
  pluck,
  mapTo
} from 'rxjs/operators';

// ============== Angular EventEmitter 兼容层 ==============

import { Subject as RxSubject, Subscription as RxSubscription } from 'rxjs';

/**
 * EventEmitter - Angular @Output() EventEmitter 的替代实现
 * 
 * 在 Angular 中，EventEmitter 用于组件输出：
 * ```
 * @Output() onClose = new EventEmitter<void>();
 * this.onClose.emit();
 * ```
 * 
 * 在我们的代码中可以同样使用：
 * ```
 * onClose = new EventEmitter<void>();
 * this.onClose.emit();
 * ```
 */
export class EventEmitter<T = any> extends RxSubject<T> {
  /**
   * 发射事件（Angular EventEmitter API）
   * 这是 Subject.next() 的别名，保持与 Angular 的 API 兼容
   */
  emit(value: T): void {
    super.next(value);
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll(): void {
    // Subject 没有直接的方法取消所有订阅
    // 但可以通过 complete() 来结束
    // 这里我们只是提供一个语义化的方法名
    this.complete();
  }

  /**
   * 获取当前订阅者数量
   */
  get listenerCount(): number {
    return this.observers.length;
  }
}

// ============== 类型定义 ==============

export type { 
  Observer, 
  PartialObserver,
  OperatorFunction,
  MonoTypeOperatorFunction,
  TeardownLogic,
  ObservableInput,
  ObservedValueOf
} from 'rxjs';

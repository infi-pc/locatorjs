export declare type FiberType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export declare type FiberRootMode = 0 | 1 | 2;
export declare type ReactDevtoolsHook = {
    supportsFiber: boolean;
    inject: (renderer: ReactInternals) => number;
    onCommitFiberUnmount: (rendererId: number, fiber: Fiber) => void;
    onCommitFiberRoot: (rendererId: number, root: FiberRoot, priorityLevel: any) => void;
    onPostCommitFiberRoot: (rendererId: number, root: FiberRoot) => void;
    renderers?: Map<number, ReactInternals>;
};
export declare type Renderer = ReactInternals;
export declare type TransferFiber = {
    id: number;
    type: FiberType;
    typeId: number;
    rootMode?: FiberRootMode;
    key: number | string | null;
    ownerId: number;
    parentId: number;
    displayName: string | null;
    hocDisplayNames: string[] | null;
    loc: string | null;
};
export declare type TransferHookInfo = {
    name: string;
    context: number | null;
    deps: number | null;
    trace: TransferCallTrace;
};
export declare type TransferFiberTypeDef = {
    contexts: TransferFiberContext[] | null;
    hooks: TransferHookInfo[];
};
export declare type TransferFiberContext = {
    name: string;
    providerId?: number;
};
export declare type TransferCallTracePoint = {
    name: string;
    loc: string | null;
};
export declare type TransferCallTrace = {
    path: TransferCallTracePoint[] | undefined;
    loc: string | null;
};
export declare type TransferValueDiff = {
    name: string;
    prev?: string;
    next?: string;
};
export declare type TransferObjectDiff = {
    keys: number;
    diffKeys: number;
    sample: TransferValueDiff[];
};
export declare type TransferArrayDiff = {
    prevLength: number;
    nextLength: number;
    eqLeft: number;
    eqRight: number;
};
export declare type TransferChangeDiff = TransferObjectDiff | TransferArrayDiff | false;
export declare type TransferPropChange = {
    name: string;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
};
export declare type TransferContextChange = {
    context: number;
    valueChangedEventId: number;
};
export declare type TransferStateChange = {
    hook: number | null;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
    calls?: null | Array<{
        name: string;
        loc: null | string;
    }>;
};
export declare type TransferDepChange = {
    index: number;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
};
export declare type TransferMemoChange = {
    hook: number;
    prev: string;
    next: string;
    diff?: TransferChangeDiff;
    deps: TransferDepChange[];
};
export declare type TransferFiberChanges = {
    props?: TransferPropChange[];
    context?: TransferContextChange[];
    state?: TransferStateChange[];
    memos?: TransferMemoChange[];
};
export declare type CommitTrigger = {
    type: "initial-mount" | "event" | "effect" | "layout-effect" | "unknown";
    kind: "mount" | "setState" | "forceUpdate" | "useReducer" | "useState";
    fiberId: number;
    relatedFiberId?: number;
    event?: string;
    loc: string | null;
};
export interface BaseMessage {
    op: string;
    id: number;
    commitId: number;
}
export interface CommitStartMessage extends BaseMessage {
    op: "commit-start";
    triggers: CommitTrigger[];
}
export interface FiberTypeDefMessage extends BaseMessage {
    op: "fiber-type-def";
    typeId: number;
    definition: TransferFiberTypeDef;
}
export interface MountFiberMessage extends BaseMessage {
    op: "mount";
    fiberId: number;
    fiber: TransferFiber;
    props: string[];
    totalTime: number;
    selfTime: number;
    trigger?: number;
}
export interface UpdateFiberMessage extends BaseMessage {
    op: "update";
    fiberId: number;
    totalTime: number;
    selfTime: number;
    changes: TransferFiberChanges | null;
    specialReasons: Array<{
        name: string;
        loc: string | null;
    }> | null;
    trigger?: number;
}
export interface UpdateBailoutStateFiberMessage extends BaseMessage {
    op: "update-bailout-state";
    fiberId: number;
    trigger?: number;
}
export interface UpdateBailoutMemoFiberMessage extends BaseMessage {
    op: "update-bailout-memo";
    fiberId: number;
    trigger?: number;
}
export interface UpdateBailoutSCUFiberMessage extends BaseMessage {
    op: "update-bailout-scu";
    fiberId: number;
    changes: TransferFiberChanges | null;
    trigger?: number;
}
export interface UnmountFiberMessage extends BaseMessage {
    op: "unmount";
    fiberId: number;
    trigger?: number;
}
export interface CreateEffectFiberMessage extends BaseMessage {
    op: "effect-create";
    fiberId: number;
    path?: string[];
}
export interface DestroyEffectFiberMessage extends BaseMessage {
    op: "effect-destroy";
    fiberId: number;
    path?: string[];
}
export declare type Message = FiberTypeDefMessage | CommitStartMessage | MountFiberMessage | UpdateFiberMessage | UpdateBailoutStateFiberMessage | UpdateBailoutMemoFiberMessage | UpdateBailoutSCUFiberMessage | UnmountFiberMessage | CreateEffectFiberMessage | DestroyEffectFiberMessage;
export declare type DistributiveOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
export declare type ReactInternals = {
    bundleType?: number;
    reconcilerVersion?: string;
    version?: string;
    currentDispatcherRef: any;
    getCurrentFiber: () => Fiber | null;
    rendererPackageName?: string;
    findFiberByHostInstance: (hostInstance: NativeType) => Fiber | null;
};
export declare type NativeType = Record<string, unknown>;
declare type HookType = "useState" | "useReducer" | "useContext" | "useRef" | "useEffect" | "useLayoutEffect" | "useCallback" | "useMemo" | "useImperativeHandle" | "useDebugValue" | "useDeferredValue" | "useTransition" | "useMutableSource" | "useOpaqueIdentifier" | "useCacheRefresh";
export declare type RefObject = {
    current: any;
};
export declare type WorkTag = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24;
export declare type ReactNode = ReactElement | ReactPortal | ReactText | ReactFragment | ReactProvider<any> | ReactConsumer<any>;
export declare type ReactEmpty = null | void | boolean;
export declare type ReactFragment = ReactEmpty | Iterable<ReactNode>;
export declare type ReactNodeList = ReactEmpty | ReactNode[];
export declare type ReactText = string | number;
export declare type ReactElement = {
    $$typeof: symbol | number;
    type: any;
    key: null | string;
    ref: any;
    props: Record<string, unknown>;
    _owner: Fiber;
    _store: {
        validated: boolean;
    };
    _self: ReactElement;
    _shadowChildren: any;
    _source: Source;
};
export declare type ReactProvider<T> = {
    $$typeof: symbol | number;
    type: ReactProviderType<T>;
    key: null | string;
    ref: null;
    props: {
        value: T;
        children?: ReactNodeList;
    };
};
export declare type ReactProviderType<T> = {
    $$typeof: symbol | number;
    _context: ReactContext<T>;
};
export declare type ReactConsumer<T> = {
    $$typeof: symbol | number;
    type: ReactContext<T>;
    key: null | string;
    ref: null;
    props: {
        children: (value: T) => ReactNodeList;
    };
};
export declare type ReactContext<T> = {
    $$typeof: symbol | number;
    Consumer: ReactContext<T>;
    Provider: ReactProviderType<T>;
    _currentValue: T;
    _currentValue2: T;
    _threadCount: number;
    _currentRenderer?: Record<string, unknown> | null;
    _currentRenderer2?: Record<string, unknown> | null;
    displayName?: string;
};
export declare type ReactPortal = {
    $$typeof: symbol | number;
    key: null | string;
    containerInfo: any;
    children: ReactNodeList;
    implementation: any;
};
export declare type ContextDependency<T> = {
    context: ReactContext<T>;
    next: ContextDependency<any> | null;
};
export declare type Dependencies = {
    lanes: Lanes;
    firstContext: ContextDependency<any> | null;
};
export declare type OldDependencies = {
    first: ContextDependency<any> | null;
};
declare type Lanes = number;
declare type Flags = number;
export declare type FiberRoot = {
    current: Fiber;
    tag: number;
};
declare type MemoizedStateMemo = {
    memoizedState: [any, any[] | null];
    next: MemoizedState;
};
export declare type MemoizedState = any;
export interface Fiber {
    tag: WorkTag;
    key: null | string;
    elementType: any;
    type: any;
    stateNode: any;
    return: Fiber | null;
    child: Fiber | null;
    sibling: Fiber | null;
    index: number;
    ref: null | (((handle: any) => void) & {
        _stringRef: string | null;
    }) | RefObject;
    pendingProps: any;
    memoizedProps: any;
    updateQueue: null;
    memoizedState: MemoizedState;
    dependencies?: Dependencies | null;
    contextDependencies?: OldDependencies | null;
    mode: number;
    flags: Flags;
    subtreeFlags: Flags;
    deletions: Array<Fiber> | null;
    nextEffect: Fiber | null;
    firstEffect: Fiber | null;
    lastEffect: Fiber | null;
    lanes: Lanes;
    childLanes: Lanes;
    alternate: Fiber | null;
    actualDuration?: number;
    actualStartTime?: number;
    selfBaseDuration?: number;
    treeBaseDuration?: number;
    _debugSource?: Source | null;
    _debugOwner?: Fiber | null;
    _debugIsCurrentlyTiming?: boolean;
    _debugNeedsRemount?: boolean;
    _debugID: number;
    _debugHookTypes?: Array<HookType> | null;
}
export declare type PathFrame = {
    key: string | null;
    index: number;
    displayName: string | null;
};
export declare type PathMatch = {
    id: number;
    isFullMatch: boolean;
};
export declare type SerializedElement = {
    displayName: string | null;
    id: number;
    key: number | string | null;
    type: FiberType;
};
export declare type OwnersList = {
    id: number;
    owners: Array<SerializedElement> | null;
};
export declare type ReactCommitData = {
    commitTime: number;
    changeDescriptions: Map<number, TransferFiberChanges> | null;
    duration: number;
    effectDuration: number | null;
    fiberActualDurations: Array<[number, number]>;
    fiberSelfDurations: Array<[number, number]>;
    passiveEffectDuration: number | null;
    priorityLevel: string | null;
    timestamp: number;
    updaters: Array<SerializedElement> | null;
};
export declare type Source = {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
};
export declare type InspectedElement = {
    id: number;
    displayName: string | null;
    canEditHooks: boolean;
    canEditFunctionProps: boolean;
    canEditHooksAndDeletePaths: boolean;
    canEditHooksAndRenamePaths: boolean;
    canEditFunctionPropsDeletePaths: boolean;
    canEditFunctionPropsRenamePaths: boolean;
    canToggleError: boolean;
    isErrored: boolean;
    targetErrorBoundaryID?: number;
    canToggleSuspense: boolean;
    canViewSource: boolean;
    hasLegacyContext: boolean;
    context: Record<string, unknown> | null;
    hooks: Record<string, unknown> | null;
    props: Record<string, unknown> | null;
    state: Record<string, unknown> | null;
    key: number | string | null;
    errors: Array<[string, number]>;
    warnings: Array<[string, number]>;
    owners: Array<SerializedElement> | null;
    source: Source | null;
    type: FiberType;
    rootType: string | null;
    rendererPackageName: string | null;
    rendererVersion: string | null;
};
export declare type RerenderState = {
    state: MemoizedState;
};
export declare type FiberDispatcherContext = {
    context: ReactContext<any>;
    reads: Array<{
        index: number;
        trace: TransferCallTrace;
    }>;
};
export declare type FiberDispatchCall = {
    dispatch: any;
    dispatchName: "setState" | "dispatch";
    root: FiberRoot;
    fiber: Fiber;
    renderFiber: Fiber | null;
    effectFiber: Fiber | null;
    effectName: "effect" | "layout-effect" | null;
    event: string | null;
    loc: string | null;
    stack?: string;
};
export declare type ClassComponentUpdateCall = {
    type: "setState" | "forceUpdate";
    rootId?: number;
    fiber?: Fiber;
    loc: string | null;
};
export declare type HookInfo = {
    name: string;
    deps: number | null;
    context: ReactContext<any> | null;
    trace: TransferCallTrace;
};
export declare type HookCompute = {
    render: number;
    hook: number;
    prev: MemoizedStateMemo;
    next: MemoizedStateMemo;
};
export declare type ReactDevtoolsHookHandlers = {
    handleCommitFiberRoot: (fiber: FiberRoot, commitPriority?: number) => void;
    handlePostCommitFiberRoot: (fiber: FiberRoot) => void;
    handleCommitFiberUnmount: (fiber: Fiber) => void;
};
export declare type ReactInterationApi = {
    findNativeNodesForFiberID: (id: number) => any[] | null;
    getFiberIDForNative: (hostInstance: NativeType, findNearestUnfilteredAncestor?: boolean) => number | null;
    getDisplayNameForFiberID: (id: number) => string | null;
    getOwnersList: (id: number) => Array<SerializedElement> | null;
    getPathForElement: (id: number) => Array<PathFrame> | null;
};
export declare type ReactDispatcherTrapApi = {
    getDispatchHookIndex: (dispatch: (state: any) => any) => number | null;
    getFiberTypeHookInfo: (fiberTypeId: number) => HookInfo[];
    getFiberComputes: (fiber: Fiber) => HookCompute[];
    getFiberRerenders: (fiber: Fiber) => RerenderState[] | undefined;
    flushDispatchCalls: (root: FiberRoot) => FiberDispatchCall[];
};
export declare type ReactIntegration = ReactDevtoolsHookHandlers & ReactInterationApi;
export declare type RecordEventHandler = (payload: DistributiveOmit<Message, "id">) => number;
export {};

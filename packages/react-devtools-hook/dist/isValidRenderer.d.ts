export declare const MIN_SUPPORTED_VERSION = "16.9.0";
export declare const BUNDLE_TYPE_PROD = 0;
export declare const BUNDLE_TYPE_DEV = 1;
export declare function isValidRenderer({ rendererPackageName, version, bundleType, }: {
    rendererPackageName?: string;
    version?: string;
    bundleType?: number;
}, reportError?: (message: string) => void): boolean;

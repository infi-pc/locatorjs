import { LabelData } from "./LabelData";
declare type SourceLocation = {
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
};
declare type ExpressionInfo = {
    type: "jsx";
    name: string;
    wrappingComponent: string | null;
    loc: SourceLocation | null;
} | {
    type: "styledComponent";
    name: string | null;
    loc: SourceLocation | null;
    htmlTag: string | null;
};
declare type FileStorage = {
    filePath: string;
    projectPath: string;
    nextId: number;
    expressions: ExpressionInfo[];
};
export declare const dataByFilename: {
    [filename: string]: FileStorage;
};
export declare function getDataForDataId(dataId: string): LabelData | null;
export declare function register(input: any): void;
export {};

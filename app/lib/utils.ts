import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { StackNode } from "~/types/node.ts"
import { convertToPure, convertToStack } from "~/lib/convert"
import {toast} from "sonner";
import {PureNodeType} from "~/types/enums.ts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nodesToString: (nodes: StackNode[]) => string = (nodes) => {
  return JSON.stringify(convertToPure(nodes), null, 2)
}

export const stringToNodes: (text: string) => StackNode[] = (text) => {
    let pureNodes;
    try {
        pureNodes = JSON.parse(text);
    } catch (error) {
        toast.error("Error parsing JSON:", error);
        return [];
    }

    pureNodes = pureNodes.filter((node: any) => {
        if (!Object.values(PureNodeType).includes(node.type)) {
            console.error(`Skipped unknown node type: ${node.type}`);
            return false;
        }
        return true;
    });

    return convertToStack(pureNodes);
}

export function remapNodeIds(nodes: StackNode[]): StackNode[] {
    let baseId = Date.now();
    return nodes.map((node, index) => ({
        ...node,
        id: baseId + index,
    }));
}

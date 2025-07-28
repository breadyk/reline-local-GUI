import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { StackNode } from "~/types/node.ts"
import { convertToPure, convertToStack } from "~/lib/convert"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nodesToString: (nodes: StackNode[]) => string = (nodes) => {
  return JSON.stringify(convertToPure(nodes), null, 2)
}

export const stringToNodes: (text: string) => StackNode[] = (text) => {
  const nodes = JSON.parse(text)
  return convertToStack(nodes)
}

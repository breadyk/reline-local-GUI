import type { StackNode } from "~/types/node.ts"

export enum NodesActionType {
  ADD = "ADD",
  DELETE = "DELETE",
  CHANGE = "CHANGE",
  MOVE = "MOVE",
  IMPORT = "IMPORT",
}
interface AddNodeActionType {
  type: NodesActionType.ADD
  payload: StackNode
}

interface DeleteNodeActionType {
  type: NodesActionType.DELETE
  payload: number
}

interface ChangeNodeActionType {
  type: NodesActionType.CHANGE
  payload: StackNode
}

interface MoveNodeActionType {
  type: NodesActionType.MOVE
  payload: {
    from: number
    to: number
  }
}

interface ImportNodeActionType {
  type: NodesActionType.IMPORT
  payload: StackNode[]
}

export type NodesAction = AddNodeActionType | DeleteNodeActionType | ChangeNodeActionType | MoveNodeActionType | ImportNodeActionType

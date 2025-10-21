import { STORAGE_KEY } from "~/constants"
import { type NodesAction, NodesActionType } from "~/types/actions"
import type { StackNode } from "~/types/node"
import { arrayMove } from "@dnd-kit/sortable"

const saveData = (nodes: StackNode[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes))
}

export const nodesReducer = (state: StackNode[], action: NodesAction): StackNode[] => {
    const newState = processAction(state, action)
    saveData(newState)
    return newState
}

const processAction = (state: StackNode[], action: NodesAction): StackNode[] => {
    const { type, payload } = action
    switch (type) {
        case NodesActionType.CHANGE:
            return state.map((node) => (node.id === payload.id ? payload : node))
        case NodesActionType.ADD:
            return [...state, payload]
        case NodesActionType.DELETE:
            return state.filter((node) => node.id !== payload)
        case NodesActionType.MOVE: {
            return arrayMove(state, payload.from, payload.to)
        }
        case NodesActionType.IMPORT:
            return payload
        default:
            return state
    }
}